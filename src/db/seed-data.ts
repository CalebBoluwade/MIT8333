export const SEED_ROLES = [
  { name: "student", label: "Student" },
  { name: "staff", label: "Staff" },
  { name: "officer", label: "Maintenance Officer" },
  { name: "admin", label: "Administrator" },
] as const;

export const SEED_CATEGORIES = [
  { name: "Electrical", description: "Faulty lighting, sockets, power outages" },
  { name: "Plumbing", description: "Leaking pipes, blocked drains, no water" },
  { name: "Furniture", description: "Damaged desks, chairs, beds, lockers" },
  { name: "Internet / Network", description: "Wi-Fi, LAN points, connectivity" },
  { name: "Classroom Equipment", description: "Projectors, boards, sound systems" },
  { name: "Hostel Maintenance", description: "Rooms, bathrooms, hostel common areas" },
  { name: "Other", description: "Anything that does not fit above" },
] as const;
