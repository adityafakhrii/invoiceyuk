import { useState } from 'react';
import { Upload, Type, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SignatureFont, signatureFonts } from '@/lib/invoice';
import { cn } from '@/lib/utils';

interface SignatureInputProps {
  signatureName: string;
  onSignatureNameChange: (name: string) => void;
  signatureImage: string;
  onSignatureImageChange: (image: string) => void;
  signatureFont: SignatureFont;
  onSignatureFontChange: (font: SignatureFont) => void;
}

type SignatureMode = 'font' | 'upload';

const SignatureInput = ({
  signatureName,
  onSignatureNameChange,
  signatureImage,
  onSignatureImageChange,
  signatureFont,
  onSignatureFontChange,
}: SignatureInputProps) => {
  const [mode, setMode] = useState<SignatureMode>(signatureImage ? 'upload' : 'font');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSignatureImageChange(reader.result as string);
        setMode('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    onSignatureImageChange('');
    setMode('font');
  };

  return (
    <div className="space-y-4">
      {/* Nama Penanda Tangan */}
      <div className="space-y-2">
        <Label htmlFor="signatureName">Nama Penanda Tangan</Label>
        <Input
          id="signatureName"
          placeholder="Contoh: Aditya Fakhri Riansyah"
          value={signatureName}
          onChange={(e) => onSignatureNameChange(e.target.value)}
        />
      </div>

      {/* Mode Selection */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'font' ? 'default' : 'outline-light'}
          size="sm"
          onClick={() => {
            setMode('font');
            onSignatureImageChange('');
          }}
        >
          <Type className="w-4 h-4 mr-1" />
          Pilih Font
        </Button>
        <Button
          type="button"
          variant={mode === 'upload' ? 'default' : 'outline-light'}
          size="sm"
          onClick={() => setMode('upload')}
        >
          <Upload className="w-4 h-4 mr-1" />
          Upload TTD
        </Button>
      </div>

      {/* Font Selection */}
      {mode === 'font' && (
        <div className="space-y-3">
          <Label>Pilih Style Tanda Tangan</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {signatureFonts.map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => onSignatureFontChange(font.id)}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-center transition-all duration-200 bg-white min-h-[80px] flex flex-col items-center justify-center",
                  signatureFont === font.id
                    ? "border-accent bg-accent/5 shadow-glow"
                    : "border-border hover:border-accent/50"
                )}
              >
                {signatureFont === font.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent-foreground" />
                  </div>
                )}
                <span
                  className="text-2xl text-foreground"
                  style={{ fontFamily: font.fontFamily }}
                >
                  {signatureName || 'Nama Anda'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">{font.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upload Image */}
      {mode === 'upload' && (
        <div className="space-y-2">
          <Label>Upload Tanda Tangan (PNG/JPG)</Label>
          <div className="flex items-center gap-4">
            {signatureImage ? (
              <div className="relative w-40 h-20 rounded-lg overflow-hidden border border-border bg-white p-2">
                <img src={signatureImage} alt="Signature" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border hover:border-accent cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload TTD</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureInput;
