"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Image as ImageIcon, Trash2, Edit3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchPastEvents, createPastEvent, updatePastEvent, deletePastEvent, uploadPastEventLogo } from "@/lib/api";
import { PastEvent } from "@/types";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function AdminPastEventsPage() {
  useRequireAuth({ role: "admin" });
  const [events, setEvents] = useState<PastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PastEvent | null>(null);
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPastEvents();
      // data might be { results, count } or just an array depending on pagination. 
      // Our API view returns a raw array.
      setEvents(Array.isArray(data) ? data : (data as any).results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenModal = (evt?: PastEvent) => {
    if (evt) {
      setEditingEvent(evt);
      setTitle(evt.title);
      setOrder(evt.order);
    } else {
      setEditingEvent(null);
      setTitle("");
      setOrder(0);
    }
    setFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setTitle("");
    setOrder(0);
    setFile(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      let savedEvent: PastEvent;
      if (editingEvent) {
        savedEvent = await updatePastEvent(editingEvent.id, { title, order });
      } else {
        savedEvent = await createPastEvent({ title, order });
      }

      if (file) {
        await uploadPastEventLogo(savedEvent.id, file);
      }
      
      await load();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || "Failed to save past event.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this past event?")) return;
    try {
      await deletePastEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-12 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-black transition-colors mb-3 inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-black mb-2">
              Past Events Gallery
            </h1>
            <p className="text-gray-600 text-[15px]">
              Manage the purely historical events shown on the homepage gallery.
            </p>
          </div>
          
          <Button onClick={() => handleOpenModal()} className="px-6 bg-black text-white hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Add Past Event
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center bg-[#f8f9fa] rounded-[24px]">
            <p className="text-gray-500 font-medium">No past events yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {events.map((evt) => (
              <div key={evt.id} className="bg-[#f8f9fa] border border-black/[0.04] rounded-[24px] p-6 relative group flex flex-col items-center justify-center min-h-[200px]">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => handleOpenModal(evt)} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-black">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(evt.id)} className="p-2 bg-white rounded-full shadow-sm text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {evt.logo_url ? (
                  <img src={evt.logo_url} alt={evt.title} className="w-20 h-20 object-contain mb-4" />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <h3 className="font-semibold text-center text-[15px]">{evt.title}</h3>
                <p className="text-xs text-gray-400 mt-1">Order: {evt.order}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md p-6 overflow-hidden">
            <h2 className="text-xl font-bold mb-4">{editingEvent ? "Edit" : "Add"} Past Event</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none"
                  placeholder="e.g. CodeStorm 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Display Order</label>
                <input
                  required
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-black hover:file:bg-gray-100 cursor-pointer"
                />
                {!file && editingEvent?.logo_url && (
                  <p className="text-xs text-green-600 mt-1">Leave empty to keep existing logo.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit" disabled={actionLoading} className="bg-black text-white px-6">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
