import AuthArt from './AuthArt.jsx';
import AuthForm from './AuthForm.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';

export default function AuthPage() {
  return (
    <div className="grid h-full lg:grid-cols-2">
      {/* the form: left */}
      <section className="relative flex items-center justify-center overflow-y-auto bg-surface px-6 py-12">
        <ThemeToggle className="absolute right-5 top-5" />
        <AuthForm />
      </section>

      {/* the illustration: right */}
      <section className="hidden items-center justify-center border-l border-border bg-elevated px-12 lg:flex">
        <div className="w-full max-w-md">
          <AuthArt />

          <h2 className="mt-10 text-2xl font-semibold tracking-tight">Two cursors. One file.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Open a private room, invite exactly who you want, and ask the assistant for
            code — it lands in everyone's editor at once.
          </p>
        </div>
      </section>
    </div>
  );
}
