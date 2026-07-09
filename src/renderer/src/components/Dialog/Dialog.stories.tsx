import type { Story } from '@ladle/react'
import { useState } from 'react'
import { Button } from '../Button'
import { Dialog } from './Dialog'

export default { title: 'Components / Dialog' }

export const Basic: Story = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Settings"
        description="A modal surface built on Radix Dialog."
      >
        <p className="text-sm text-fg">Dialog body content goes here.</p>
      </Dialog>
    </>
  )
}

export const WithoutDescription: Story = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Dialog open={open} onOpenChange={setOpen} title="Confirm">
        <p className="text-sm text-fg">Are you sure?</p>
      </Dialog>
    </>
  )
}
