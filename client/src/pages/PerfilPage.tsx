import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Moon, Sun, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const schema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  licensePlate: z.string().min(1, 'Placa obrigatória'),
  carModel: z.string().min(1, 'Modelo obrigatório'),
  carColor: z.string().min(1, 'Cor obrigatória'),
  licenseNumber: z.string().min(1, 'Número de habilitação obrigatório'),
  pixKey: z.string().optional(),
  pixBank: z.string().optional(),
  themeColor: z.string().optional(),
  darkMode: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function PerfilPage() {
  const { user, refreshUser } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      themeColor: '#F5C518',
      darkMode: false,
    },
  });

  const darkMode = watch('darkMode');

  useEffect(() => {
    if (user?.profile) {
      reset({
        fullName: user.profile.fullName,
        licensePlate: user.profile.licensePlate,
        carModel: user.profile.carModel,
        carColor: user.profile.carColor,
        licenseNumber: user.profile.licenseNumber,
        pixKey: user.profile.pixKey || '',
        pixBank: user.profile.pixBank || '',
        themeColor: user.profile.themeColor || '#F5C518',
        darkMode: user.profile.darkMode || false,
      });
    }
  }, [user, reset]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', !!darkMode);
  }, [darkMode]);

  const onSubmit = async (data: FormData) => {
    try {
      await api.put('/profile', data);
      await refreshUser();
      toast.success('Perfil atualizado com sucesso!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao salvar perfil';
      toast.error(msg);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append(type, file);
    type === 'photo' ? setUploadingPhoto(true) : setUploadingLogo(true);
    try {
      await api.post(`/profile/${type}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      toast.success(`${type === 'photo' ? 'Foto' : 'Logo'} atualizada com sucesso!`);
    } catch {
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      type === 'photo' ? setUploadingPhoto(false) : setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configure seus dados profissionais</p>
      </div>

      {/* Photo & Logo */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-4">Foto e Logo</h2>
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border-2 border-taxi-yellow relative">
              {user?.profile?.photoUrl
                ? <img src={user.profile.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Camera className="w-7 h-7 text-gray-300" /></div>
              }
            </div>
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="text-xs text-taxi-yellow font-medium flex items-center gap-1"
            >
              {uploadingPhoto ? <span className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3 h-3" />}
              Foto
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'photo')} />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 relative">
              {user?.profile?.logoUrl
                ? <img src={user.profile.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                : <div className="w-full h-full flex items-center justify-center text-center p-2"><p className="text-xs text-gray-400">Sem logo</p></div>
              }
            </div>
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="text-xs text-taxi-yellow font-medium flex items-center gap-1"
            >
              {uploadingLogo ? <span className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3 h-3" />}
              Logo
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'logo')} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Dados pessoais */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Dados Pessoais</h2>
          <div>
            <label className="label">Nome Completo</label>
            <input {...register('fullName')} placeholder="João da Silva" className="input-field" />
            {errors.fullName && <p className="error-text">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="label">Número de Habilitação</label>
            <input {...register('licenseNumber')} placeholder="12345678901" className="input-field" />
            {errors.licenseNumber && <p className="error-text">{errors.licenseNumber.message}</p>}
          </div>
        </div>

        {/* Dados do veículo */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Veículo</h2>
          <div>
            <label className="label">Placa</label>
            <input {...register('licensePlate')} placeholder="ABC-1234" className="input-field uppercase" />
            {errors.licensePlate && <p className="error-text">{errors.licensePlate.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Modelo</label>
              <input {...register('carModel')} placeholder="Toyota Corolla" className="input-field" />
              {errors.carModel && <p className="error-text">{errors.carModel.message}</p>}
            </div>
            <div>
              <label className="label">Cor</label>
              <input {...register('carColor')} placeholder="Branco" className="input-field" />
              {errors.carColor && <p className="error-text">{errors.carColor.message}</p>}
            </div>
          </div>
        </div>

        {/* PIX */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Dados PIX</h2>
          <div>
            <label className="label">Chave PIX</label>
            <input {...register('pixKey')} placeholder="CPF, e-mail, telefone ou chave aleatória" className="input-field" />
          </div>
          <div>
            <label className="label">Banco</label>
            <input {...register('pixBank')} placeholder="Nome do banco" className="input-field" />
          </div>
        </div>

        {/* Aparência */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Aparência</h2>
          <div>
            <label className="label">Cor do recibo</label>
            <div className="flex items-center gap-3">
              <input {...register('themeColor')} type="color" className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
              <div className="flex gap-2">
                {['#F5C518', '#2563EB', '#16a34a', '#dc2626', '#7c3aed'].map(c => (
                  <button key={c} type="button" onClick={() => setValue('themeColor', c)}
                    className="w-7 h-7 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              {darkMode ? <Moon className="w-4 h-4 text-gray-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
              <span className="text-sm text-gray-600 dark:text-gray-300">Modo escuro</span>
            </div>
            <div className="relative">
              <input {...register('darkMode')} type="checkbox" className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-checked:bg-taxi-yellow rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-taxi-yellow/50"></div>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-base py-3">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Salvando...
            </span>
          ) : 'Salvar Perfil'}
        </button>
      </form>
    </div>
  );
}
