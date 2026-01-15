import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Edit2, Check, X, Loader2, Camera, Trophy, Zap, Calendar, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useUser } from '@/hooks/useUser';
import { useCheckAchievements, useUserAchievements } from '@/hooks/useAchievements';
import { AchievementsGrid } from '@/components/AchievementsGrid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  },
};

export default function ProfilePage() {
  const { user, loading, updateUser } = useUser();
  const { checkAndUnlock } = useCheckAchievements();
  const { data: userAchievements } = useUserAchievements();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      checkAndUnlock();
    }
  }, [user]);

  const handleSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await updateUser({ name: newName.trim() });
    setEditing(false);
    setSaving(false);
    toast.success('Name updated successfully!');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateUser({ avatar_url: publicUrl });
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Profile Card */}
          <motion.div variants={itemVariants} className="glass-card p-8 text-center relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <Waves className="w-full h-full" />
            </div>
            
            <div className="relative z-10">
              {/* Avatar */}
              <div className="relative inline-block mb-6">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Avatar className="w-28 h-28 ring-4 ring-primary/30 shadow-2xl shadow-primary/20">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-primary text-4xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute bottom-1 right-1 w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </motion.button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div 
                    key="editing"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2 justify-center mb-6"
                  >
                    <Input 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                      className="max-w-[200px] h-10 rounded-xl text-center" 
                      placeholder="New name"
                      autoFocus
                    />
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Button size="icon" variant="ghost" onClick={handleSave} disabled={saving} className="rounded-xl">
                        <Check className="w-4 h-4 text-green-400" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(false)} className="rounded-xl">
                        <X className="w-4 h-4 text-red-400" />
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="display"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 justify-center mb-6"
                  >
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient">{user.name}</h1>
                    <motion.button 
                      onClick={() => { setNewName(user.name); setEditing(true); }} 
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* XP Badge */}
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="inline-block mb-6"
              >
                <div className="xp-badge text-lg px-5 py-2">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  <span className="font-bold">{user.xp}</span>
                  <span>XP</span>
                </div>
              </motion.div>

              {/* Member since */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Sailing since {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Achievements Preview */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Trophy className="w-5 h-5 text-amber-400" />
                </motion.div>
                <div>
                  <h2 className="font-semibold text-foreground">My Achievements</h2>
                  <p className="text-xs text-muted-foreground">{userAchievements?.length || 0} unlocked</p>
                </div>
              </div>
              <Link to="/achievements">
                <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    View All →
                  </Button>
                </motion.div>
              </Link>
            </div>
            <AchievementsGrid showAll={false} />
          </motion.div>

          {/* XP breakdown */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <motion.div 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Zap className="w-5 h-5 text-primary" />
              </motion.div>
              <h3 className="font-semibold text-foreground">How to Earn XP</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { xp: '+2 XP', desc: 'Watch 25% of video', color: 'primary' },
                { xp: '+3 XP', desc: 'Watch 50% of video', color: 'primary' },
                { xp: '+3 XP', desc: 'Watch 75% of video', color: 'primary' },
                { xp: '+2 XP', desc: 'Complete video', color: 'primary' },
                { xp: '+5 XP', desc: 'Complete PDF', color: 'accent' },
                { xp: '+5-100 XP', desc: 'Unlock badges', color: 'amber' },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className={`bg-${item.color === 'amber' ? 'amber-500' : item.color}/5 rounded-xl p-3`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <p className={`${item.color === 'amber' ? 'text-amber-400' : `text-${item.color}`} font-semibold`}>
                    {item.xp}
                  </p>
                  <p className="text-muted-foreground text-xs">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
