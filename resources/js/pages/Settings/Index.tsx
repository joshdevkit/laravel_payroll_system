import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { FlashMessage } from '@/components/layout/FlashMessage';
import { Header } from '@/components/layout/Header';
import { Navbar } from '@/components/layout/Navbar';
import { PayrollSettingsForm, type PayrollSettings } from '@/components/settings/PayrollSettingsForm';

type SettingsPageProps = {
    settings: PayrollSettings;
};

export default function Index({ settings }: SettingsPageProps) {
    return (
        <>
            <Header title="Settings" />
            <AuthenticatedLayout>
                <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">System</p>
                    <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">Payroll Configurations</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Configure the rules used when a payroll run is calculated and reviewed.</p>
                </div>
                <PayrollSettingsForm initialSettings={settings} />
            </AuthenticatedLayout>
        </>
    );
}
