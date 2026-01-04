import React from 'react';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage, Language, languageNames } from '@/contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages: Language[] = ['en', 'ja', 'zh', 'es', 'alien'];

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
        <SelectTrigger className="w-[140px] h-8 bg-background border-border">
          <SelectValue placeholder={t('language.select')} />
        </SelectTrigger>
        <SelectContent className="bg-background border-border z-50">
          {languages.map((lang) => (
            <SelectItem key={lang} value={lang} className="cursor-pointer">
              <span className="flex items-center gap-2">
                {lang === 'alien' ? '👽' : getFlagEmoji(lang)}
                <span>{languageNames[lang]}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const getFlagEmoji = (lang: Language): string => {
  const flags: Record<Language, string> = {
    en: '🇺🇸',
    ja: '🇯🇵',
    zh: '🇨🇳',
    es: '🇪🇸',
    alien: '👽',
  };
  return flags[lang];
};

export default LanguageSelector;
