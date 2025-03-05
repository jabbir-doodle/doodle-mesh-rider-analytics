import { render, screen } from '@testing-library/react'
import RFSignalAnalysisChart from '../../components/RssiNoiseChart'

describe('RFSignalAnalysisChart Component', () => {
  const mockLogData = {
    stations: [],
    noiseFloor: -95,
    timestamp: Date.now()
  }

  test('renders chart', () => {
    render(<RFSignalAnalysisChart logData={mockLogData} />)
    expect(screen.getByText(/Signal Strength/i)).toBeInTheDocument()
  })

  test('shows SNR margin button', () => {
    render(<RFSignalAnalysisChart logData={mockLogData} />)
    expect(screen.getByText(/SNR Margin/i)).toBeInTheDocument()
  })
})