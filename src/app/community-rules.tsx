import { LegalScreen } from '@/components/legal-screen';
import { rulesSections } from '@/constants/legal-texts';

export default function CommunityRulesScreen() {
  return <LegalScreen title="Reglas de la comunidad" sections={rulesSections} />;
}