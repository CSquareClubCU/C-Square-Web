export type UserRole = 'student' | 'volunteer' | 'admin';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted' | 'cancelled';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_cu_student: boolean;
  student_uid: string | null;
  branch: string | null;
  year: number | null;
  semester: number | null;
  batch: string | null;
  phone: string | null;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: 'hackathon' | 'competition' | 'workshop' | 'seminar';
  start_datetime: string;
  end_datetime: string;
  venue: string;
  capacity: number;
  status: EventStatus;
  is_team_event: boolean;
  is_open_to_external: boolean;
  banner_image_url: string | null;
  registration_deadline: string;
  registered_count: number;
}
