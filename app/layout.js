import './globals.css';

export const metadata = {
  title: 'Clarity — Data Cleanup & Insights',
  description: 'Clean up your data and get a clear next step for your business.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
