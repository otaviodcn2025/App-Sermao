import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Shield, 
  User,
  Search,
  Loader2,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate, cn } from '../lib/utils';

interface AdminPanelProps {
  onBack: () => void;
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(userList);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (uid: string, status: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { approved: status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleToggleRole = async (uid: string, currentRole: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { 
        role: currentRole === 'admin' ? 'user' : 'admin',
        approved: true // Make sure admins are always approved
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente este usuário?')) {
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 md:h-20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users size={24} className="text-orange-600" /> 
                Gestão de Usuários
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                Administração do Sistema
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
            <Loader2 className="animate-spin text-orange-600" size={32} />
            <p className="text-sm font-medium">Carregando lista de usuários...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop View */}
            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center w-16">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center w-16">ADM</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Usuário</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Cadastro em</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                      <motion.tr 
                        key={user.uid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleApprove(user.uid, !user.approved)}
                            className={`p-2 rounded-xl transition-all ${user.approved ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-50 hover:bg-orange-50 hover:text-orange-600'}`}
                            title={user.approved ? 'Aprovado' : 'Pendente'}
                          >
                            {user.approved ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleRole(user.uid, user.role)}
                            className={`p-2 rounded-xl transition-all ${user.role === 'admin' ? 'text-orange-600 bg-orange-50' : 'text-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                            title={user.role === 'admin' ? 'Administrador' : 'Usuário Comum'}
                            disabled={user.email === 'pastorotavio@gmail.com'}
                          >
                            <Shield size={20} />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                              <User size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{user.name}</p>
                              <p className="text-xs text-slate-500 font-mono tracking-tighter">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 font-medium">
                            {formatDate(user.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteUser(user.uid)}
                              disabled={user.email === 'pastorotavio@gmail.com'}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-0"
                              title="Excluir Usuário"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              <AnimatePresence>
                {filteredUsers.map((user) => (
                  <motion.div 
                    key={user.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{user.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user.uid)}
                        disabled={user.email === 'pastorotavio@gmail.com'}
                        className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg disabled:opacity-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={() => handleApprove(user.uid, !user.approved)}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                          user.approved ? 'text-green-700 bg-green-50' : 'text-orange-700 bg-orange-50'
                        )}
                      >
                        {user.approved ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                        {user.approved ? 'Aprovado' : 'Pendente'}
                      </button>
                      <button
                        onClick={() => handleToggleRole(user.uid, user.role)}
                        disabled={user.email === 'pastorotavio@gmail.com'}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                          user.role === 'admin' ? 'text-orange-700 bg-orange-50' : 'text-slate-600 bg-slate-50'
                        )}
                      >
                        <Shield size={16} />
                        {user.role === 'admin' ? 'Admin' : 'Usuário'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredUsers.length === 0 && (
              <div className="bg-white p-20 text-center rounded-3xl border border-slate-200 text-slate-400">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
