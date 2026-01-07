import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles, Edit2, Check, X, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/useUser';

export default function ProfilePage() {
  const { user, loading, updateUser } = useUser();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await updateUser({ name: newName.trim() });
    setEditing(false);
    setSaving(false);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/30">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          {editing ? (
            <div className="flex items-center gap-2 justify-center mb-4">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="max-w-[200px]" placeholder="New name" />
              <Button size="icon" variant="ghost" onClick={handleSave} disabled={saving}><Check className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center mb-4">
              <h1 className="text-2xl font-display font-bold">{user.name}</h1>
              <button onClick={() => { setNewName(user.name); setEditing(true); }} className="p-1 hover:bg-white/10 rounded">
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}

          <div className="xp-badge text-lg mb-6">
            <Sparkles className="w-4 h-4" />
            {user.xp} XP
          </div>

          <div className="text-sm text-muted-foreground">
            Member since {new Date(user.created_at).toLocaleDateString()}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
