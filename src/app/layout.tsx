import type { Metadata } from "next";
import ThemeRegistry from "@/components/ThemeRegistry";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ZOU Attachment Logbook",
  description: "Digital attachment logbook for ZOU students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeRegistry>
            <Navbar />
            {children}
          </ThemeRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
