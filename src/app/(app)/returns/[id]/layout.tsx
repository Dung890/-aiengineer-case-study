import { ReturnChrome } from '@/components/shell/ReturnChrome';

export default function ReturnLayout({ children }: { children: React.ReactNode }) {
  return <ReturnChrome>{children}</ReturnChrome>;
}
