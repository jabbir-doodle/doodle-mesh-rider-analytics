import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { expect, jest } from '@jest/globals'
import LogFileUpload from '../../components/LogFileUpload'

describe('LogFileUpload Component', () => {
    const mockOnFileLoaded = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders upload area', () => {
        render(<LogFileUpload onFileLoaded={mockOnFileLoaded} />)
        expect(screen.getByText(/Drop your files here/i)).toBeInTheDocument()
    })

    it('handles file upload', async () => {
        render(<LogFileUpload onFileLoaded={mockOnFileLoaded} />)

        const file = new File(['test content'], 'test.log', { type: 'text/plain' })
        const input = screen.getByTestId('file-input')

        fireEvent.change(input, { target: { files: [file] } })

        expect(mockOnFileLoaded).toHaveBeenCalled()
    })
})