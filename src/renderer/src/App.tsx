import { Button } from './components/Button'

// Empty shell (BL-001) now demonstrating the BL-033 component pattern: styling
// flows only through Button's variant/size props — no className on the component.
export function App() {
  return (
    <main className="flex min-h-screen flex-col items-start gap-4 p-8">
      <h1 className="text-xl font-semibold">SDD IDE — empty shell</h1>
      <p className="text-muted">React + Tailwind + a token-driven Button (BL-033).</p>
      <div className="flex gap-3">
        <Button variant="primary">Primary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </div>
    </main>
  )
}
