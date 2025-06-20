// Development authentication bypass for database issues
const devUsers = new Map();
let userIdCounter = 1;

export function createDevUser(email: string) {
  const id = userIdCounter++;
  const [firstName, lastName] = email.split('@')[0].split('.');
  const user = {
    id,
    email,
    firstName: firstName || "User",
    lastName: lastName || "",
    isActive: true,
    createdAt: new Date(),
    jobTitle: "Professional",
    company: "NetworkMatch User",
    industry: "Technology",
    experienceLevel: "5-10",
    profileImageUrl: null,
    bio: null
  };
  devUsers.set(id, user);
  return user;
}

export function getDevUser(id: number) {
  return devUsers.get(id);
}

export function getDevUserByEmail(email: string) {
  return Array.from(devUsers.values()).find(user => user.email === email);
}