import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>Access denied</h1>
        <p style={styles.body}>Your account does not have admin access to this dashboard.</p>
        <Link href="/login" style={styles.link}>
          Sign in with a different account
        </Link>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9fafb',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '40px 32px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
    width: 360,
    textAlign: 'center',
  },
  title: { fontSize: 22, fontWeight: 700, color: '#dc2626', marginBottom: 12 },
  body: { fontSize: 15, color: '#6b7280', marginBottom: 24 },
  link: { color: '#16a34a', fontWeight: 500, textDecoration: 'none' },
};
