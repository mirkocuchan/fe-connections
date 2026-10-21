import { LegalScreen } from '@/components/legal-screen';
import { termsSections } from '@/constants/legal-texts';

export default function TermsScreen() {
  return <LegalScreen title="Términos y condiciones" sections={termsSections} />;
}