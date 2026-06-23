import { Event } from '@/types';

// ============================================================================
// MOCK DATA & API INTERFACE
// 
// This file is structured so that you can easily delete the mock data blocks 
// and replace the function bodies with actual `fetch` calls to your backend 
// once it is ready. Just set USE_MOCK = false and ensure BASE_URL is correct.
// ============================================================================

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'HackCU 2026',
    description: '<p>Join us for the biggest hackathon at Chandigarh University! This 24-hour coding marathon brings together the brightest minds on campus to build, break, and innovate.</p><p>Whether you\'re a first-year or final-year student, HackCU is your chance to collaborate with peers, solve real-world problems, and compete for exciting prizes.</p><h3>What to expect:</h3><ul><li>24 hours of non-stop coding</li><li>Mentorship from industry experts</li><li>Free food and swag</li><li>Prizes worth ₹50,000+</li></ul>',
    event_type: 'hackathon',
    start_datetime: '2026-08-15T09:00:00Z',
    end_datetime: '2026-08-16T18:00:00Z',
    venue: 'Block 10, Chandigarh University',
    capacity: 200,
    status: 'published',
    is_team_event: true,
    is_open_to_external: true,
    banner_image_url: null,
    registration_deadline: '2026-08-10T23:59:00Z',
    registered_count: 145,
  },
  {
    id: '2',
    title: 'Intro to Web3 Workshop',
    description: '<p>Explore the world of decentralized applications, smart contracts, and blockchain technology in this hands-on workshop.</p><p>By the end of this session, you\'ll have deployed your first smart contract on a test network!</p>',
    event_type: 'workshop',
    start_datetime: '2026-09-05T14:00:00Z',
    end_datetime: '2026-09-05T17:00:00Z',
    venue: 'Seminar Hall, Block 3',
    capacity: 50,
    status: 'published',
    is_team_event: false,
    is_open_to_external: false,
    banner_image_url: null,
    registration_deadline: '2026-09-04T23:59:00Z',
    registered_count: 48,
  },
  {
    id: '3',
    title: 'AI/ML Bootcamp 2026',
    description: '<p>A comprehensive 2-day bootcamp covering machine learning fundamentals, neural networks, and practical applications using Python and TensorFlow.</p>',
    event_type: 'workshop',
    start_datetime: '2026-10-12T10:00:00Z',
    end_datetime: '2026-10-13T16:00:00Z',
    venue: 'Computer Lab, Block 8',
    capacity: 80,
    status: 'published',
    is_team_event: false,
    is_open_to_external: true,
    banner_image_url: null,
    registration_deadline: '2026-10-10T23:59:00Z',
    registered_count: 32,
  },
  {
    id: '4',
    title: 'CodeRush — Speed Coding Competition',
    description: '<p>Think fast, code faster! CodeRush is a timed competitive programming contest where you solve algorithmic challenges under pressure.</p>',
    event_type: 'competition',
    start_datetime: '2026-09-20T15:00:00Z',
    end_datetime: '2026-09-20T18:00:00Z',
    venue: 'Auditorium, Block 5',
    capacity: 120,
    status: 'published',
    is_team_event: false,
    is_open_to_external: false,
    banner_image_url: null,
    registration_deadline: '2026-09-18T23:59:00Z',
    registered_count: 89,
  },
  {
    id: '5',
    title: 'Tech Talks — Career in Cloud Computing',
    description: '<p>Industry leaders from AWS and Azure share insights on building a career in cloud computing, certifications that matter, and the future of cloud-native development.</p>',
    event_type: 'seminar',
    start_datetime: '2026-11-01T11:00:00Z',
    end_datetime: '2026-11-01T13:00:00Z',
    venue: 'Conference Room, Block 1',
    capacity: 150,
    status: 'published',
    is_team_event: false,
    is_open_to_external: true,
    banner_image_url: null,
    registration_deadline: '2026-10-30T23:59:00Z',
    registered_count: 67,
  },
  {
    id: '6',
    title: 'Open Source Contribution Sprint',
    description: '<p>Spend a weekend contributing to real open-source projects. Mentors will guide you through your first PR!</p>',
    event_type: 'hackathon',
    start_datetime: '2026-11-15T09:00:00Z',
    end_datetime: '2026-11-16T18:00:00Z',
    venue: 'Innovation Lab, Block 10',
    capacity: 60,
    status: 'published',
    is_team_event: true,
    is_open_to_external: false,
    banner_image_url: null,
    registration_deadline: '2026-11-12T23:59:00Z',
    registered_count: 24,
  },
];

const MOCK_TEAM = [
  {
    id: '1',
    full_name: 'Aditi Sharma',
    designation: 'Club President',
    photo_url: null,
  },
  {
    id: '2',
    full_name: 'Rahul Verma',
    designation: 'Technical Lead',
    photo_url: null,
  },
  {
    id: '3',
    full_name: 'Priya Kapoor',
    designation: 'Events Coordinator',
    photo_url: null,
  },
  {
    id: '4',
    full_name: 'Vikram Joshi',
    designation: 'Backend Developer',
    photo_url: null,
  },
  {
    id: '5',
    full_name: 'Neha Patel',
    designation: 'Frontend Developer',
    photo_url: null,
  },
  {
    id: '6',
    full_name: 'Arjun Singh',
    designation: 'Design Lead',
    photo_url: null,
  },
  {
    id: '7',
    full_name: 'Kavya Mehta',
    designation: 'Marketing Head',
    photo_url: null,
  },
  {
    id: '8',
    full_name: 'Rohit Kumar',
    designation: 'Community Manager',
    photo_url: null,
  },
];

// ============================================================================
// API FUNCTIONS
// Replace these with real `fetch` requests when the backend is ready.
// Set USE_MOCK = false and ensure BASE_URL points to your Django API.
// ============================================================================

const USE_MOCK = true;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function fetchEvents(): Promise<Event[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_EVENTS;
  }
  
  const res = await fetch(`${BASE_URL}/events/`, {
    credentials: 'include',
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  return data.results;
}

export async function fetchEventById(id: string): Promise<Event> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const event = MOCK_EVENTS.find(e => e.id === id);
    if (!event) throw new Error("Event not found");
    return event;
  }

  const res = await fetch(`${BASE_URL}/events/${id}/`, {
    credentials: 'include',
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function fetchTeam() {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_TEAM;
  }

  const res = await fetch(`${BASE_URL}/team/`, {
    credentials: 'include',
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  return data.results;
}
