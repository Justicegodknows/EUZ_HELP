import { redirect } from "next/navigation";

import { auth } from "@/app/(auth)/auth";

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }
    return <>{children}</>;
}
