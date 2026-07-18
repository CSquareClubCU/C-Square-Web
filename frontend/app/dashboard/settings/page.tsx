"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Loader2, Settings as SettingsIcon, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { FadeUp } from "@/components/animations/MotionElements";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { refresh } = useAuth();

  const [fullName, setFullName] = useState("");
  const [studentUid, setStudentUid] = useState("");
  
  // External student fields
  const [institution, setInstitution] = useState("");
  const [degreeType, setDegreeType] = useState("");
  const [graduationYear, setGraduationYear] = useState("");

  // Social Links
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [isCuStudent, setIsCuStudent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize form fields once user is loaded
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setIsCuStudent(!!user.is_cu_student);
      
      if (user.is_cu_student) {
        const email = user.email.toLowerCase();
        if (email.endsWith("@cuchd.in") || email.endsWith("@cumail.in")) {
          // Auto-extract UID from CU emails
          const extractedUid = email.split("@")[0].toUpperCase();
          setStudentUid(extractedUid);
        } else {
          setStudentUid(user.student_uid || "");
        }
      } else {
        setInstitution(user.institution || "");
        setDegreeType(user.degree_type || "");
        setGraduationYear(user.graduation_year ? String(user.graduation_year) : "");
      }
      setGithubUrl(user.github_url || "");
      setLinkedinUrl(user.linkedin_url || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    const payload: Parameters<typeof updateUserProfile>[0] = { full_name: fullName.trim() };

    if (isCuStudent) {
      if (!studentUid.trim()) {
        setError("Please enter your Student UID.");
        return;
      }
      payload.student_uid = studentUid.trim();
    } else {
      if (!institution.trim() || !degreeType.trim() || !graduationYear.trim()) {
        setError("Please fill out all educational details.");
        return;
      }
      const year = parseInt(graduationYear.trim(), 10);
      if (isNaN(year) || year < 2020 || year > 2040) {
        setError("Please enter a valid graduation year (e.g. 2026).");
        return;
      }
      payload.institution = institution.trim();
      payload.degree_type = degreeType.trim();
      payload.graduation_year = year;
    }

    payload.github_url = githubUrl.trim() || null;
    payload.linkedin_url = linkedinUrl.trim() || null;

    setLoading(true);
    try {
      await updateUserProfile(payload);

      // Refresh context so useRequireAuth doesn't bounce us back!
      await refresh();
      router.push("/dashboard?profile_updated=true");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.fields) {
        const fields = err.fields;
        const firstField = Object.keys(fields)[0];
        // Format the field name nicely (e.g. "student_uid" -> "Student Uid")
        const formattedField = firstField.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        setError(`${formattedField}: ${fields[firstField][0]}`);
      } else {
        setError(err instanceof Error ? err.message : "Failed to update profile.");
      }
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center py-12 px-5 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full flex flex-col items-start">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <FadeUp className="w-full">
          <div className="text-center md:text-left mb-10">
            <div className="mx-auto md:mx-0 w-16 h-16 bg-black rounded-[16px] flex items-center justify-center mb-6 shadow-xl">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Profile Settings
            </h2>
            <p className="text-[15px] text-gray-500">
              Update your personal details and social links.
            </p>
          </div>

          <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-black/[0.04] p-8 w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 rounded-[12px] flex items-start gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-4 bg-emerald-50 rounded-[12px] flex items-start gap-3 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">Profile updated successfully.</p>
                </div>
              )}

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-[12px] border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>

              {isCuStudent ? (
                <div>
                  <label htmlFor="student_uid" className="block text-sm font-medium text-gray-900 mb-2">
                    Student UID
                  </label>
                  <div className="relative">
                    <input
                      id="student_uid"
                      type="text"
                      value={studentUid}
                      onChange={(e) => setStudentUid(e.target.value.toUpperCase())}
                      className="block w-full rounded-[12px] border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition-colors bg-gray-50 text-gray-500 cursor-not-allowed"
                      placeholder="24BCSXXXX"
                      required
                      readOnly
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-emerald-500 group">
                      <CheckCircle2 className="w-5 h-5" />
                      <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        Extracted automatically from your university email.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="institution" className="block text-sm font-medium text-gray-900 mb-2">
                      Educational Institution
                    </label>
                    <input
                      id="institution"
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="block w-full rounded-[12px] border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors"
                      placeholder="e.g. Stanford University"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="degree_type" className="block text-sm font-medium text-gray-900 mb-2">
                      Degree Type
                    </label>
                    <input
                      id="degree_type"
                      type="text"
                      value={degreeType}
                      onChange={(e) => setDegreeType(e.target.value)}
                      className="block w-full rounded-[12px] border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors"
                      placeholder="e.g. B.Tech Computer Science"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="graduation_year" className="block text-sm font-medium text-gray-900 mb-2">
                      Expected Year of Graduation
                    </label>
                    <input
                      id="graduation_year"
                      type="number"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="block w-full rounded-[12px] border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors"
                      placeholder="e.g. 2026"
                      min="2020"
                      max="2040"
                      required
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Social Profiles (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="github_url" className="block text-sm font-medium text-gray-900 mb-2">
                      GitHub URL
                    </label>
                    <input
                      id="github_url"
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="block w-full rounded-[12px] border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors"
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div>
                    <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-900 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      id="linkedin_url"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="block w-full rounded-[12px] border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white hover:bg-gray-800 h-12 rounded-[12px]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
