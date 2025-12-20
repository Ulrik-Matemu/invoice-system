import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '../context/AuthContext';
import { getUserSettings, updateUserSettings } from '../lib/firestore';
import { HelpCircle } from 'lucide-react';

export const TourGuide = () => {
    const { user } = useAuth();

    const driverObj = driver({
        showProgress: true,
        steps: [
            {
                element: '#sidebar-nav',
                popover: {
                    title: 'Navigation',
                    description: 'Use the sidebar to navigate between your Dashboard, Invoices, Clients, and Settings.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#dashboard-stats',
                popover: {
                    title: 'Dashboard Stats',
                    description: 'Get a quick overview of your total revenue, pending invoices, and active clients.',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '#new-invoice-btn',
                popover: {
                    title: 'Create Invoices',
                    description: 'Click here to create a new invoice. You can select existing clients or add new ones on the fly.',
                    side: 'bottom',
                    align: 'end'
                }
            },
            {
                element: '#nav-settings',
                popover: {
                    title: 'Settings',
                    description: 'Configure your company details, tax rate, and choose your preferred invoice template here.',
                    side: 'right',
                    align: 'center'
                }
            }
        ],
        onDestroyStarted: () => {
            if (user) {
                updateUserSettings(user.uid, { hasSeenTour: true });
            }
            driverObj.destroy();
        }
    });

    useEffect(() => {
        const checkTour = async () => {
            if (user) {
                const settings = await getUserSettings(user.uid);
                if (!settings.hasSeenTour) {
                    // Small delay to ensure UI is rendered
                    setTimeout(() => {
                        driverObj.drive();
                    }, 1000);
                }
            }
        };
        checkTour();
    }, [user]);

    const startTour = () => {
        driverObj.drive();
    };

    return (
        <button
            onClick={startTour}
            className="hidden md:block fixed bottom-6 right-6 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors z-50"
            title="Start Tour"
        >
            <HelpCircle className="w-6 h-6" />
        </button>
    );
};
