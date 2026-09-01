import { Head } from '@inertiajs/react';

interface HeaderProps {
    title: string;
    description?: string;
}

export function Header({
    title,
    description,
}: HeaderProps) {
    return (
        <Head>
            <title>{title}</title>

            {description && (
                <meta
                    name="description"
                    content={description}
                />
            )}
        </Head>
    );
}
