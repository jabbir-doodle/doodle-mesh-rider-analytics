// import React from 'react';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import FirmwarePortal from '../FirmwarePortal';

// // Mock the framer-motion since it causes issues in test environment
// jest.mock('framer-motion', () => {
//     const actual = jest.requireActual('framer-motion');
//     return {
//         ...actual,
//         motion: {
//             div: ({ children, ...props }) => <div {...props}>{children}</div>,
//             button: ({ children, ...props }) => <button {...props}>{children}</button>,
//         },
//         AnimatePresence: ({ children }) => <>{children}</>,
//     };
// });

// // Mock the ParticleBackground component
// jest.mock('../ParticleBackground', () => ({
//     __esModule: true,
//     default: () => <div data-testid="particle-background" />,
// }));

// describe('FirmwarePortal Component', () => {
//     // Rendering tests
//     test('renders the component with title', () => {
//         render(<FirmwarePortal />);
//         expect(screen.getByText('Mesh Rider Firmware Management')).toBeInTheDocument();
//     });

//     test('renders stable releases tab by default', () => {
//         render(<FirmwarePortal />);
//         expect(screen.getByText('Stable Releases')).toBeInTheDocument();
//         expect(screen.getByText('firmware-2024-10.4')).toBeInTheDocument();
//     });

//     test('renders back button when onBack prop is provided', () => {
//         const mockOnBack = jest.fn();
//         render(<FirmwarePortal onBack={mockOnBack} />);

//         const backButton = screen.getByLabelText('Go back to dashboard');
//         expect(backButton).toBeInTheDocument();

//         fireEvent.click(backButton);
//         expect(mockOnBack).toHaveBeenCalledTimes(1);
//     });

//     // Tab switching tests
//     test('switches to beta tab when clicked', async () => {
//         render(<FirmwarePortal />);

//         // Click on Beta Channel tab
//         fireEvent.click(screen.getByText('Beta Channel'));

//         // Should show beta firmware
//         await waitFor(() => {
//             expect(screen.getByText('firmware-2024-11.0-beta.2')).toBeInTheDocument();
//         });
//     });

//     test('shows login modal when developer tab is clicked without authentication', () => {
//         render(<FirmwarePortal />);

//         // Click on Developer Builds tab
//         fireEvent.click(screen.getAllByText('Developer Builds')[0]);

//         // Should show login modal
//         expect(screen.getByText('Developer Access')).toBeInTheDocument();
//         expect(screen.getByText('Enter your credentials to access developer builds')).toBeInTheDocument();
//     });

//     // Search functionality tests
//     test('filters firmware versions based on search query', async () => {
//         render(<FirmwarePortal />);

//         // Type in search box
//         const searchInput = screen.getByPlaceholderText('Search firmware by version, features, or changelog...');
//         userEvent.type(searchInput, '10.3');

//         // Should only show firmware with 10.3 in the version
//         await waitFor(() => {
//             expect(screen.queryByText('firmware-2024-10.4')).not.toBeInTheDocument();
//             expect(screen.getByText('firmware-2024-10.3')).toBeInTheDocument();
//         });
//     });

//     test('shows advanced search options when advanced search is clicked', () => {
//         render(<FirmwarePortal />);

//         // Click advanced search button
//         fireEvent.click(screen.getByText('Advanced Search'));

//         // Should show advanced search options
//         expect(screen.getByText('Hardware Model')).toBeInTheDocument();
//         expect(screen.getByText('Security Level')).toBeInTheDocument();
//         expect(screen.getByText('Release Date')).toBeInTheDocument();
//     });

//     // Firmware details tests
//     test('expands firmware details when clicked', async () => {
//         render(<FirmwarePortal />);

//         // Click on firmware version to expand
//         fireEvent.click(screen.getByText('firmware-2024-10.4').closest('div'));

//         // Should show expanded details
//         await waitFor(() => {
//             expect(screen.getByText("What's New")).toBeInTheDocument();
//             expect(screen.getByText('Compatible Hardware')).toBeInTheDocument();
//             expect(screen.getByText('File Verification')).toBeInTheDocument();
//         });
//     });

//     test('shows download notification when download button is clicked', async () => {
//         render(<FirmwarePortal />);

//         // Find and click download button
//         const downloadButtons = screen.getAllByText('Download');
//         fireEvent.click(downloadButtons[0]);

//         // Should show notification
//         await waitFor(() => {
//             expect(screen.getByText(/Downloading firmware/)).toBeInTheDocument();
//         });
//     });

//     // Authentication tests
//     test('developer login with correct credentials', async () => {
//         render(<FirmwarePortal />);

//         // Click on Developer Builds to show login modal
//         fireEvent.click(screen.getAllByText('Developer Builds')[0]);

//         // Enter credentials
//         userEvent.type(screen.getByLabelText('Username'), 'developer');
//         userEvent.type(screen.getByLabelText('Password'), 'password');

//         // Submit form
//         fireEvent.click(screen.getByText('Login'));

//         // Should show success notification
//         await waitFor(() => {
//             expect(screen.getByText('Developer access granted')).toBeInTheDocument();
//         });

//         // Should now show developer firmware versions
//         await waitFor(() => {
//             expect(screen.getByText('firmware-2024-11.0-dev.4')).toBeInTheDocument();
//         });
//     });

//     test('developer login with incorrect credentials', async () => {
//         render(<FirmwarePortal />);

//         // Click on Developer Builds to show login modal
//         fireEvent.click(screen.getAllByText('Developer Builds')[0]);

//         // Enter wrong credentials
//         userEvent.type(screen.getByLabelText('Username'), 'wrong');
//         userEvent.type(screen.getByLabelText('Password'), 'credentials');

//         // Submit form
//         fireEvent.click(screen.getByText('Login'));

//         // Should show error notification
//         await waitFor(() => {
//             expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
//         });
//     });

//     // Responsive behavior tests
//     test('shows mobile menu button on small screens', () => {
//         // Mock window.innerWidth
//         global.innerWidth = 500;
//         global.dispatchEvent(new Event('resize'));

//         render(<FirmwarePortal />);

//         // Should show mobile menu button
//         const menuButton = screen.getByRole('button', { name: /menu/i });
//         expect(menuButton).toBeInTheDocument();

//         // Click to open mobile menu
//         fireEvent.click(menuButton);

//         // Should show mobile menu
//         expect(screen.getByText('Stable Releases')).toBeInTheDocument();
//         expect(screen.getByText('Beta Channel')).toBeInTheDocument();
//         expect(screen.getByText('Developer Access')).toBeInTheDocument();

//         // Reset window width
//         global.innerWidth = 1024;
//         global.dispatchEvent(new Event('resize'));
//     });

//     // Additional edge case tests
//     test('scrolls to top when tab is changed', async () => {
//         // Mock window.scrollTo
//         const scrollToMock = jest.fn();
//         global.scrollTo = scrollToMock;

//         render(<FirmwarePortal />);

//         // Change tab
//         fireEvent.click(screen.getByText('Beta Channel'));

//         // Should call scrollTo
//         expect(scrollToMock).toHaveBeenCalledWith(0, 0);
//     });

//     test('resets expanded version when tab is changed', async () => {
//         render(<FirmwarePortal />);

//         // Expand a firmware version
//         fireEvent.click(screen.getByText('firmware-2024-10.4').closest('div'));

//         // Wait for expansion
//         await waitFor(() => {
//             expect(screen.getByText("What's New")).toBeInTheDocument();
//         });

//         // Change tab
//         fireEvent.click(screen.getByText('Beta Channel'));

//         // Go back to stable tab
//         fireEvent.click(screen.getByText('Stable Releases'));

//         // Should not show expanded content anymore
//         await waitFor(() => {
//             expect(screen.queryByText("What's New")).not.toBeInTheDocument();
//         });
//     });

//     test('handles no firmware versions matching search', async () => {
//         render(<FirmwarePortal />);

//         // Type a search string that won't match anything
//         const searchInput = screen.getByPlaceholderText('Search firmware by version, features, or changelog...');
//         userEvent.type(searchInput, 'xyznonexistent123');

//         // Should show no results message
//         await waitFor(() => {
//             expect(screen.getByText('No Matching Firmware')).toBeInTheDocument();
//         });
//     });
// });