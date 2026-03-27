import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role to list all users since regular users can't list others
  const users = await base44.asServiceRole.entities.User.list();

  // Return only safe fields
  const team = users.map((u) => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    profile_picture: u.profile_picture,
    specialization: u.specialization,
    phone: u.phone,
  }));

  return Response.json({ team });
});