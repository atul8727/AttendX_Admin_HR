import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import Button from './Button.jsx'

describe('Button', () => {
  test('children text screen par dikhta hai', () => {
    render(<Button>Save</Button>)
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  test('click hone par onClick handler call hota hai', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Save</Button>)

    fireEvent.click(screen.getByText('Save'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('disabled prop lagane par button click nahi hota', () => {
    const handleClick = vi.fn()
    render(
      <Button disabled onClick={handleClick}>
        Save
      </Button>
    )

    fireEvent.click(screen.getByText('Save'))

    expect(handleClick).not.toHaveBeenCalled()
  })
})