import { Container } from '@/components/Container'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white py-8 text-zinc-500">
      <Container className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>Idea di Luce · demo ecommerce headless</p>
        <p>Catalogo, carrello, checkout e ordini via API interne /api/v1</p>
      </Container>
    </footer>
  )
}
