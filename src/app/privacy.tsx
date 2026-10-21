import { LegalScreen } from '@/components/legal-screen';
import { privacySections } from '@/constants/legal-texts';

export default function PrivacyScreen() {
  return <LegalScreen title="Política de privacidad" sections={privacySections} />;
}