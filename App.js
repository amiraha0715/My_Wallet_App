import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NAME = 'there'; // <- put your name here for "Hi, <name>!"
const CURRENCY = 'DA';
const CATS = [
  { key: 'clothes', emoji: '👗' },
  { key: 'skincare', emoji: '🧴' },
  { key: 'makeup', emoji: '💄' },
  { key: 'food', emoji: '🍓' },
  { key: 'other', emoji: '🎀' },
];
const emojiOf = (k) => (CATS.find((c) => c.key === k) || {}).emoji || '✨';
const STORE_KEY = 'wallet-v1';
// "2026-10-03T14:47:00.000Z" -> "Oct 3, 2:47 PM"
const fmtDate = (iso) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time}`;
};

export default function App() {
  const [txs, setTxs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState(false);       // add/take sheet visible?
  const [mode, setMode] = useState('income');    // 'income' = Add, 'expense' = Take
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [cat, setCat] = useState(null);
  const [menu, setMenu] = useState(false);       // category dropdown open?
  const [editingId, setEditingId] = useState(null); // null = new transaction, otherwise the id being edited

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then((v) => {
      if (v) setTxs(JSON.parse(v));
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORE_KEY, JSON.stringify(txs));
  }, [txs, loaded]);

  const stats = useMemo(() => {
    const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = txs.filter((t) => t.type === 'expense');
    const spent = exp.reduce((s, t) => s + t.amount, 0);
    const byCat = {};
    exp.forEach((t) => (byCat[t.cat] = (byCat[t.cat] || 0) + t.amount));
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    const months = new Set(exp.map((t) => t.date.slice(0, 7)));
    return { balance: income - spent, top, avg: spent / Math.max(months.size, 1), hasExp: exp.length > 0 };
  }, [txs]);

  const resetForm = () => { setAmount(''); setNote(''); setCat(null); setMenu(false); setEditingId(null); };
  const closeSheet = () => { resetForm(); setOpen(false); };
  const openNew = () => { resetForm(); setMode('income'); setOpen(true); };
  const openEdit = (t) => {               // pre-fill the sheet with the tapped transaction
    setEditingId(t.id); setMode(t.type); setAmount(String(t.amount));
    setNote(t.note || ''); setCat(t.cat); setMenu(false); setOpen(true);
  };

  const save = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    if (mode === 'expense' && !cat) { setMenu(true); return; } // must pick a category
    const fields = { type: mode, amount: n, cat: mode === 'expense' ? cat : null, note: note.trim() };
    if (editingId) {
      // keep the original id and date, replace only the edited fields
      setTxs(txs.map((t) => (t.id === editingId ? { ...t, ...fields } : t)));
    } else {
      setTxs([{ id: String(Date.now()), date: new Date().toISOString(), ...fields }, ...txs]);
    }
    closeSheet();
  };

  const remove = () =>
    Alert.alert('Delete transaction?', 'This will also change your balance.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { setTxs(txs.filter((t) => t.id !== editingId)); closeSheet(); } },
    ]);

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  const list = showAll ? txs.slice(0, 20) : txs.slice(0, 3);

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.body}>
        <View style={s.header}>
          <Text style={s.month}>{monthLabel}</Text>
          <Text style={s.hi}>Hi, {NAME}! 🌸</Text>
        </View>

        {/* Wallet built from Views: flap + body + clasp */}
        <View style={s.walletWrap}>
          <View style={s.flap} />
          <View style={s.walletBody}>
            <Text style={s.walletLabel}>my wallet</Text>
            <Text style={s.balance}>{stats.balance.toFixed(2)} <Text style={s.cur}>{CURRENCY}</Text></Text>
            <View style={s.clasp}><View style={s.claspDot} /></View>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Latest transactions</Text>
          {list.length === 0 && <Text style={s.muted}>Nothing yet. Tap + to start.</Text>}
          {list.map((t) => (
            <TouchableOpacity key={t.id} style={s.txRow} onPress={() => openEdit(t)} activeOpacity={0.7}>
              <View>
                <Text style={[s.txAmt, { color: t.type === 'expense' ? '#D6537A' : '#3E9B7A' }]}>
                  {t.type === 'expense' ? '−' : '+'}{t.amount.toFixed(0)}
                </Text>
                {!!t.note && <Text style={s.txNote} numberOfLines={1}>{t.note}</Text>}
                <Text style={s.txDate}>{fmtDate(t.date)}</Text>
              </View>
              <View style={s.tag}><Text style={s.tagTxt}>{t.type === 'expense' ? `${emojiOf(t.cat)} ${t.cat}` : '✨ income'}</Text></View>
            </TouchableOpacity>
          ))}
          {txs.length > 3 && (
            <TouchableOpacity onPress={() => setShowAll(!showAll)}>
              <Text style={s.more}>{showAll ? 'show less' : 'show more'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[s.card, { backgroundColor: '#F3EBFD', borderBottomColor: '#D9C9F2' }]}>
          <Text style={s.cardTitle}>Overview</Text>
          <Text style={s.overview}>
            {stats.hasExp
              ? `It seems like you spend most of your money on ${stats.top[0]} ${emojiOf(stats.top[0])}. Your average is ${stats.avg.toFixed(0)} ${CURRENCY} a month.`
              : 'Log your first spend and I will tell you where your money goes.'}
          </Text>
        </View>
      </ScrollView>

      {/* bottom bar with raised + button */}
      <View style={s.bar} />
      <TouchableOpacity style={s.plus} onPress={openNew} activeOpacity={0.8}>
        <Text style={s.plusTxt}>+</Text>
      </TouchableOpacity>

      {/* Add / Take sheet */}
      <Modal visible={open} animationType="slide" transparent onRequestClose={closeSheet}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.toggle}>
              {[['income', 'Add'], ['expense', 'Take']].map(([m, label]) => (
                <TouchableOpacity key={m} style={[s.toggleBtn, mode === m && s.toggleOn]} onPress={() => setMode(m)}>
                  <Text style={s.toggleTxt}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Amount</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" placeholder="0" value={amount} onChangeText={setAmount} />

            {mode === 'expense' && (
              <>
                <Text style={s.label}>Category</Text>
                <TouchableOpacity style={s.input} onPress={() => setMenu(!menu)}>
                  <Text style={{ color: cat ? '#333' : '#aaa' }}>{cat ? `${emojiOf(cat)} ${cat}` : 'choose a category ▾'}</Text>
                </TouchableOpacity>
                {menu && CATS.map((c) => (
                  <TouchableOpacity key={c.key} style={s.option} onPress={() => { setCat(c.key); setMenu(false); }}>
                    <Text>{c.emoji} {c.key}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <Text style={s.label}>Note</Text>
            <TextInput style={s.input} placeholder={mode === 'income' ? 'where did it come from?' : 'optional'} value={note} onChangeText={setNote} />

            <TouchableOpacity style={s.save} onPress={save}><Text style={s.saveTxt}>{editingId ? 'Save changes' : mode === 'income' ? 'Add to wallet' : 'Take from wallet'}</Text></TouchableOpacity>
            {!!editingId && <TouchableOpacity style={s.del} onPress={remove}><Text style={s.delTxt}>Delete</Text></TouchableOpacity>}
            <TouchableOpacity onPress={closeSheet}><Text style={s.more}>cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// "Clay" look: a thicker, darker bottom border fakes depth, soft shadow lifts it off the page.
const puffy = { shadowColor: '#B07A98', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 };

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF0F5' },
  body: { padding: 20, paddingBottom: 140 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  month: { color: '#A98FDB', fontWeight: '800', fontSize: 15 },
  hi: { color: '#5B4B7A', fontWeight: '800', fontSize: 18 },

  walletWrap: { marginBottom: 24 },
  flap: { height: 30, marginHorizontal: 14, backgroundColor: '#E58AAE', borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  walletBody: { backgroundColor: '#F7A8C4', borderRadius: 32, borderBottomWidth: 8, borderBottomColor: '#E58AAE', padding: 26, marginTop: -8, ...puffy },
  walletLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  balance: { color: '#fff', fontSize: 44, fontWeight: '900', textShadowColor: 'rgba(160,60,110,0.25)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 4 },
  cur: { fontSize: 20, fontWeight: '700' },
  clasp: { position: 'absolute', right: -6, top: 36, width: 44, height: 44, borderRadius: 22, backgroundColor: '#C9B6EE', borderBottomWidth: 4, borderBottomColor: '#A98FDB', alignItems: 'center', justifyContent: 'center' },
  claspDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 26, borderBottomWidth: 6, borderBottomColor: '#F3DCE8', padding: 18, marginBottom: 18, ...puffy },
  cardTitle: { fontWeight: '800', fontSize: 16, color: '#5B4B7A', marginBottom: 10 },
  muted: { color: '#aaa' },
  txRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF7FA', borderRadius: 16, padding: 12, marginBottom: 8 },
  txAmt: { fontWeight: '800', fontSize: 16 },
  txNote: { color: '#5B4B7A', fontSize: 14, marginTop: 2, maxWidth: 190 },
  txDate: { color: '#B3A5C9', fontSize: 12, marginTop: 2 },
  tag: { backgroundColor: '#EADFF7', borderBottomWidth: 3, borderBottomColor: '#D3C1EE', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  tagTxt: { color: '#5B4B7A', fontWeight: '600' },
  more: { textAlign: 'center', color: '#8E6BD8', fontWeight: '700', marginTop: 8 },
  overview: { color: '#4a3d66', fontSize: 15, lineHeight: 22 },

  bar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 74, backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, ...puffy },
  plus: { position: 'absolute', bottom: 38, alignSelf: 'center', width: 70, height: 70, borderRadius: 35, backgroundColor: '#8E6BD8', borderBottomWidth: 6, borderBottomColor: '#6F4FB8', alignItems: 'center', justifyContent: 'center', ...puffy },
  plusTxt: { color: '#fff', fontSize: 38, lineHeight: 42, fontWeight: '600' },

  overlay: { flex: 1, backgroundColor: 'rgba(91,75,122,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF0F5', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 22, paddingBottom: 34 },
  toggle: { flexDirection: 'row', backgroundColor: '#EADFF7', borderRadius: 20, padding: 4, marginBottom: 14 },
  toggleBtn: { flex: 1, padding: 11, borderRadius: 16, alignItems: 'center' },
  toggleOn: { backgroundColor: '#fff', borderBottomWidth: 3, borderBottomColor: '#D3C1EE' },
  toggleTxt: { fontWeight: '800', color: '#5B4B7A' },
  label: { color: '#5B4B7A', fontWeight: '700', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#fff', borderRadius: 16, borderBottomWidth: 4, borderBottomColor: '#F3DCE8', padding: 14, marginBottom: 8 },
  option: { backgroundColor: '#F3EBFD', borderRadius: 12, padding: 12, marginBottom: 6, marginLeft: 12 },
  save: { backgroundColor: '#8E6BD8', borderBottomWidth: 6, borderBottomColor: '#6F4FB8', borderRadius: 22, padding: 15, alignItems: 'center', marginTop: 10 },
  del: { backgroundColor: '#FFE1E8', borderBottomWidth: 5, borderBottomColor: '#F4B6C6', borderRadius: 22, padding: 13, alignItems: 'center', marginTop: 10 },
  delTxt: { color: '#D6537A', fontWeight: '800', fontSize: 15 },
  saveTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
