import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";

/**
 * One-time bootstrap: if the Admin table is empty and ADMIN_EMAIL /
 * ADMIN_PASSWORD are set, create that admin when the login attempt matches.
 * Does not run when any admin already exists (no credential override).
 */
export async function ensureBootstrapAdmin(
  email: string,
  password: string
): Promise<{ id: number; email: string } | null> {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!configuredEmail || !configuredPassword) {
    return null;
  }

  if (email !== configuredEmail || password !== configuredPassword) {
    return null;
  }

  const count = await prisma.admin.count();
  if (count > 0) {
    return null;
  }

  const created = await prisma.admin.create({
    data: {
      email: configuredEmail,
      password: hashPassword(configuredPassword),
    },
  });

  console.info(`Bootstrap: created first admin (${created.email})`);
  return { id: created.id, email: created.email };
}

/** Re-fetch after bootstrap, or verify password for an existing row. */
export async function findAdminForLogin(email: string, password: string) {
  const bootstrapped = await ensureBootstrapAdmin(email, password);
  if (bootstrapped) {
    return bootstrapped;
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !verifyPassword(password, admin.password)) {
    return null;
  }

  return { id: admin.id, email: admin.email };
}
