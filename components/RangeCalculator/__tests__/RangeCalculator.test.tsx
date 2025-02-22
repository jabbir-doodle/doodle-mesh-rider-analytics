import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import RangeCalculator from '../RangeCalculator';


// Mock radio models
jest.mock('../../../constants/radioModels', () => ({
    radioModels: {
        defaultModel: {
            name: 'Test Model',
            power: [20, 20, 20, 20, 20, 20, 20, 20],
            sensitivity: [-90, -90, -90, -90, -90, -90, -90, -90]
        }
    }
}));

describe('RangeCalculator', () => {
    const mockProps = {
        isOpen: true,
        onClose: jest.fn()
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    test('renders without crashing', () => {
        render(<RangeCalculator {...mockProps} />);
        expect(screen.getByText(/Range Calculator/i)).toBeInTheDocument();
    });

    test('toggles advanced options', () => {
        render(<RangeCalculator {...mockProps} />);
        const advancedButton = screen.getByText(/Advanced Options/i);
        fireEvent.click(advancedButton);
        expect(screen.getByText(/Advanced Settings/i)).toBeInTheDocument();
    });

    test('switches between MCS modes', () => {
        render(<RangeCalculator {...mockProps} />);
        const modeSwitch = screen.getByLabelText(/MCS Mode/i);
        fireEvent.click(modeSwitch);
        expect(screen.getByText(/Multiplexing/i)).toBeInTheDocument();
    });

    test('calculates range with basic inputs', async () => {
        render(<RangeCalculator {...mockProps} />);

        // Fill required inputs
        fireEvent.change(screen.getByLabelText(/Frequency/i), { target: { value: '5800' } });
        fireEvent.change(screen.getByLabelText(/Bandwidth/i), { target: { value: '40' } });

        // Trigger calculation
        const calculateButton = screen.getByText(/Calculate/i);
        fireEvent.click(calculateButton);

        // Wait for calculation delay
        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

        // Check results
        expect(screen.getByText(/Results/i)).toBeInTheDocument();
    });

    test('handles invalid inputs', () => {
        render(<RangeCalculator {...mockProps} />);

        const calculateButton = screen.getByText(/Calculate/i);
        fireEvent.click(calculateButton);

        expect(screen.getByText(/Please fill all required fields/i)).toBeInTheDocument();
    });

    test('closes calculator', () => {
        render(<RangeCalculator {...mockProps} />);

        const closeButton = screen.getByLabelText(/Close/i);
        fireEvent.click(closeButton);

        expect(mockProps.onClose).toHaveBeenCalled();
    });
});