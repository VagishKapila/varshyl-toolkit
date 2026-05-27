export interface AuthUserAdapter {
  findUserByEmail(email: string): Promise<{ id: string } | null>;
  createUser(input: {
    email: string;
    name?: string;
    provider: 'email' | 'apple' | 'google';
  }): Promise<{ id: string }>;
  getUserById(id: string): Promise<{ id: string; email: string } | null>;
  sendPasswordResetEmail(input: { to: string; resetUrl: string }): Promise<void>;
}
