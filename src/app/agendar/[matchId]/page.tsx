'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBracketMatch, parseMatchWindow, findOverlaps, formatDate, HOURS } from '@/lib/schedule';

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type AvailabilityMap = Record<string, Record<string, string[]>>; // player → date → slots

type ScheduleRequest = {
  id: string;
  matchId: string;
  fromPlayer: string;
  toPlayer: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  status: string;
  counterDate: string | null;
  counterStart: string | null;
  counterEnd: string | null;
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

const SLOT_SIZE = 44; // px per hour cell height

function slotKey(date: string, hour: string) { return `${date}|${hour}`; }

/* ------------------------------------------------------------------ */
/* SUBCOMPONENTS                                                       */
/* ------------------------------------------------------------------ */

function RequestBanner({
  req,
  myName,
  onRespond,
}: {
  req: ScheduleRequest;
  myName: string;
  onRespond: (action: 'confirm' | 'refuse' | 'counter', counter?: { date: string; start: string; end: string }) => void;
}) {
  const isToMe = req.toPlayer === myName;
  const isFromMe = req.fromPlayer === myName;

  if (req.status === 'confirmed') {
    return (
      <div style={{ background: 'rgba(5,72,47,0.08)', border: '1px solid var(--qg-green)', borderRadius: 'var(--qg-radius-md)', padding: '18px 24px', marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--qg-green)', marginBottom: 6 }}>Partida agendada</div>
        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 18, fontWeight: 700, color: 'var(--qg-fg-1)' }}>
          {formatDate(req.date)} • {req.startTime} – {req.endTime}
        </div>
        {req.location && (
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--qg-fg-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {req.location}
          </div>
        )}
      </div>
    );
  }

  if (req.status === 'refused') {
    return (
      <div style={{ background: 'rgba(211,82,32,0.06)', border: '1px solid var(--qg-clay)', borderRadius: 'var(--qg-radius-md)', padding: '18px 24px', marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--qg-clay)', marginBottom: 6 }}>Proposta recusada</div>
        <div style={{ fontSize: 13, color: 'var(--qg-fg-2)' }}>
          {isFromMe ? `${req.toPlayer} recusou o horário. Faça uma nova proposta.` : `Você recusou o horário proposto por ${req.fromPlayer}.`}
        </div>
      </div>
    );
  }

  if (req.status === 'pending' && isToMe) {
    return (
      <div style={{ background: 'var(--qg-bg-elev)', border: '1px solid var(--qg-line)', borderRadius: 'var(--qg-radius-md)', padding: '20px 24px', marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--qg-clay)', marginBottom: 8 }}>Proposta recebida de {req.fromPlayer}</div>
        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 20, fontWeight: 700, color: 'var(--qg-fg-1)', marginBottom: req.location ? 8 : 20 }}>
          {formatDate(req.date)} • {req.startTime} – {req.endTime}
        </div>
        {req.location && (
          <div style={{ marginTop: 0, marginBottom: 16, fontSize: 13, color: 'var(--qg-fg-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {req.location}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => onRespond('confirm')} style={{ padding: '10px 22px', borderRadius: 'var(--qg-radius-sm)', border: 'none', background: 'var(--qg-green)', color: 'var(--qg-cream)', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em' }}>
            Confirmar
          </button>
          <button onClick={() => onRespond('refuse')} style={{ padding: '10px 22px', borderRadius: 'var(--qg-radius-sm)', border: '1px solid var(--qg-clay)', background: 'transparent', color: 'var(--qg-clay)', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em' }}>
            Recusar
          </button>
        </div>
      </div>
    );
  }

  if (req.status === 'pending' && isFromMe) {
    return (
      <div style={{ background: 'var(--qg-bg-elev)', border: '1px solid var(--qg-line)', borderRadius: 'var(--qg-radius-md)', padding: '18px 24px', marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 6 }}>Aguardando resposta de {req.toPlayer}</div>
        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 18, fontWeight: 700, color: 'var(--qg-fg-1)' }}>
          {formatDate(req.date)} • {req.startTime} – {req.endTime}
        </div>
      </div>
    );
  }

  if (req.status === 'counter' && isToMe) {
    return (
      <div style={{ background: 'var(--qg-bg-elev)', border: '1px solid var(--qg-line)', borderRadius: 'var(--qg-radius-md)', padding: '20px 24px', marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 8 }}>Contraproposta de {req.fromPlayer}</div>
        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 20, fontWeight: 700, color: 'var(--qg-fg-1)', marginBottom: 20 }}>
          {req.counterDate ? formatDate(req.counterDate) : '—'} • {req.counterStart} – {req.counterEnd}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onRespond('confirm')} style={{ padding: '10px 22px', borderRadius: 'var(--qg-radius-sm)', border: 'none', background: 'var(--qg-green)', color: 'var(--qg-cream)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Confirmar
          </button>
          <button onClick={() => onRespond('refuse')} style={{ padding: '10px 22px', borderRadius: 'var(--qg-radius-sm)', border: '1px solid var(--qg-clay)', background: 'transparent', color: 'var(--qg-clay)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Recusar
          </button>
        </div>
      </div>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function AgendarPage() {
  const params  = useParams();
  const router  = useRouter();
  const matchId = params.matchId as string;
  const { data: session, status } = useSession();
  const myName  = session?.user?.playerName ?? null;

  const match = getBracketMatch(matchId);
  const days  = match ? parseMatchWindow(match.dates) : [];

  // Local availability state (my slots): date → Set<hour>
  const [mySlots, setMySlots] = useState<Record<string, Set<string>>>({});
  // Server availability for all players
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  // Schedule request
  const [schedReq, setSchedReq] = useState<ScheduleRequest | null>(null);
  // Saving state
  const [saving, setSaving] = useState(false);
  // Selected proposal
  const [proposal, setProposal] = useState<{ date: string; start: string; end: string } | null>(null);
  const [sending, setSending] = useState(false);
  // Toast
  const [toast, setToast] = useState<string | null>(null);
  // Location for proposals
  const [location, setLocation] = useState('');
  // Manual proposal (when opponent has no availability)
  const [manualDate, setManualDate] = useState('');
  const [manualHour, setManualHour] = useState('09:00');

  const fetchData = useCallback(async () => {
    const [avRes, srRes] = await Promise.all([
      fetch(`/api/availability/${matchId}`),
      fetch(`/api/schedule-request/${matchId}`),
    ]);
    const av = await avRes.json() as AvailabilityMap;
    const sr = await srRes.json() as ScheduleRequest | null;
    setAvailability(av);
    setSchedReq(sr);
    // Pre-fill my slots from server
    if (myName && av[myName]) {
      const filled: Record<string, Set<string>> = {};
      for (const [date, slots] of Object.entries(av[myName])) {
        filled[date] = new Set(slots);
      }
      setMySlots(filled);
    }
  }, [matchId, myName]);

  useEffect(() => { if (myName) fetchData(); }, [myName, fetchData]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (status === 'loading') return null;
  if (!match) return <div className="page" style={{ paddingTop: 48 }}>Partida não encontrada.</div>;
  if (!myName) {
    return (
      <div className="page" style={{ paddingTop: 64, maxWidth: 480 }}>
        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 22, fontWeight: 700, color: 'var(--qg-fg-1)', marginBottom: 12 }}>Acesso restrito</div>
        <div style={{ fontSize: 14, color: 'var(--qg-fg-3)', marginBottom: 24 }}>Faça login com sua conta vinculada ao torneio para agendar partidas.</div>
        <Link href="/" style={{ color: 'var(--qg-green)', fontSize: 13 }}>← Voltar ao início</Link>
      </div>
    );
  }

  const isPlayer = myName === match.p1.name || myName === match.p2.name;
  if (!isPlayer) {
    return (
      <div className="page" style={{ paddingTop: 64, maxWidth: 480 }}>
        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 22, fontWeight: 700, color: 'var(--qg-fg-1)', marginBottom: 12 }}>Sem acesso</div>
        <div style={{ fontSize: 14, color: 'var(--qg-fg-3)', marginBottom: 24 }}>Você não é um dos jogadores desta partida.</div>
        <Link href="/painel" style={{ color: 'var(--qg-green)', fontSize: 13 }}>← Voltar ao painel</Link>
      </div>
    );
  }

  const opponent = myName === match.p1.name ? match.p2.name : match.p1.name;
  const oppSlots  = availability[opponent] ?? {};

  // Toggle a slot on/off
  function toggleSlot(date: string, hour: string) {
    setMySlots(prev => {
      const next = { ...prev, [date]: new Set(prev[date] ?? []) };
      next[date].has(hour) ? next[date].delete(hour) : next[date].add(hour);
      return next;
    });
  }

  // Save all my slots to the server
  async function save() {
    setSaving(true);
    await Promise.all(
      days.map(date =>
        fetch(`/api/availability/${matchId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, slots: [...(mySlots[date] ?? [])].sort() }),
        })
      )
    );
    await fetchData();
    setSaving(false);
  }

  // Send proposal
  async function sendProposal() {
    if (!proposal) return;
    setSending(true);
    const res = await fetch(`/api/schedule-request/${matchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...proposal, toPlayer: opponent, location: location.trim() || null }),
    });
    const data = await res.json() as ScheduleRequest;
    setSchedReq(data);
    setProposal(null);
    setSending(false);
    setToast(`Solicitação enviada para ${opponent}`);
  }

  // Send proposal without overlap (opponent has no availability)
  async function sendManualProposal() {
    const date = manualDate || days[0];
    if (!date) return;
    const endHour = `${String(parseInt(manualHour) + 2).padStart(2, '0')}:00`;
    setSending(true);
    const res = await fetch(`/api/schedule-request/${matchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, startTime: manualHour, endTime: endHour, toPlayer: opponent, location: location.trim() || null }),
    });
    const data = await res.json() as ScheduleRequest;
    setSchedReq(data);
    setSending(false);
    setToast(`Solicitação enviada para ${opponent}`);
  }

  // Respond to a proposal
  async function respond(action: 'confirm' | 'refuse' | 'counter', counter?: { date: string; start: string; end: string }) {
    const res = await fetch(`/api/schedule-request/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, counterDate: counter?.date, counterStart: counter?.start, counterEnd: counter?.end }),
    });
    const data = await res.json() as ScheduleRequest;
    setSchedReq(data);
  }

  const oppHasAvailability = Object.keys(oppSlots).length > 0;
  const canManualPropose = !oppHasAvailability && (!schedReq || schedReq.status === 'refused');
  const manualEndHour = `${String(parseInt(manualHour) + 2).padStart(2, '0')}:00`;

  // Compute overlaps per day
  const overlapsByDay = days.map(date => {
    const mine = [...(mySlots[date] ?? [])].sort();
    const theirs = (oppSlots[date] ?? []).sort();
    return { date, blocks: findOverlaps(mine, theirs) };
  }).filter(d => d.blocks.length > 0);

  const hasOverlaps = overlapsByDay.length > 0;

  return (
    <div className="page" style={{ paddingTop: 48, paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/painel" style={{ fontSize: 12, color: 'var(--qg-fg-3)', letterSpacing: '0.06em', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          ← Painel
        </Link>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-clay)', marginBottom: 6 }}>
          {match.round} · Agendamento
        </div>
        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--qg-fg-1)', lineHeight: 1.1 }}>
          {match.p1.name} <span style={{ color: 'var(--qg-fg-4)', fontWeight: 400 }}>×</span> {match.p2.name}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--qg-fg-3)' }}>Janela: {match.dates}</div>
      </div>

      {/* Request banner */}
      {schedReq && (
        <RequestBanner req={schedReq} myName={myName} onRespond={respond} />
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { color: 'rgba(5,72,47,0.25)', label: 'Minha disponibilidade' },
          { color: 'rgba(99,102,241,0.22)', label: `Disponibilidade de ${opponent}` },
          { color: 'rgba(5,72,47,0.55)', label: 'Sobreposição' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--qg-fg-3)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid — one column per day */}
      <div style={{ overflowX: 'auto', marginBottom: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `48px repeat(${days.length}, minmax(100px, 1fr))`, minWidth: days.length * 100 + 48 }}>

          {/* Header row */}
          <div />
          {days.map(date => (
            <div key={date} style={{ textAlign: 'center', padding: '8px 4px', fontSize: 11, fontWeight: 700, color: 'var(--qg-fg-2)', letterSpacing: '0.06em', borderBottom: '1px solid var(--qg-line)' }}>
              {formatDate(date)}
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map(hour => (
            <>
              <div key={`lbl-${hour}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10, fontSize: 10, color: 'var(--qg-fg-4)', fontVariantNumeric: 'tabular-nums', height: SLOT_SIZE }}>
                {hour}
              </div>
              {days.map(date => {
                const mine   = mySlots[date]?.has(hour) ?? false;
                const theirs = (oppSlots[date] ?? []).includes(hour);
                const overlap = mine && theirs;
                let bg = 'transparent';
                if (overlap) bg = 'rgba(5,72,47,0.55)';
                else if (mine) bg = 'rgba(5,72,47,0.25)';
                else if (theirs) bg = 'rgba(99,102,241,0.22)';

                return (
                  <div
                    key={slotKey(date, hour)}
                    onClick={() => toggleSlot(date, hour)}
                    style={{
                      height: SLOT_SIZE,
                      background: bg,
                      border: '1px solid var(--qg-line)',
                      cursor: 'pointer',
                      transition: 'background 80ms',
                      borderRadius: 2,
                    }}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={save}
        disabled={saving}
        style={{ padding: '11px 28px', borderRadius: 'var(--qg-radius-sm)', border: 'none', background: 'var(--qg-fg-1)', color: 'var(--qg-bg)', fontWeight: 700, fontSize: 13, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, letterSpacing: '0.04em', marginBottom: 36 }}
      >
        {saving ? 'Salvando…' : 'Salvar disponibilidade'}
      </button>

      {/* Overlaps section */}
      {hasOverlaps && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', paddingBottom: 10, marginBottom: 16, borderBottom: '1px solid var(--qg-line)' }}>
            Horários com sobreposição
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {overlapsByDay.flatMap(({ date, blocks }) =>
              blocks.map((block, i) => {
                const isSelected = proposal?.date === date && proposal?.start === block.start && proposal?.end === block.end;
                return (
                  <div
                    key={`${date}-${i}`}
                    onClick={() => setProposal(isSelected ? null : { date, start: block.start, end: block.end })}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 20px',
                      borderRadius: 'var(--qg-radius-md)',
                      border: `1px solid ${isSelected ? 'var(--qg-green)' : 'var(--qg-line)'}`,
                      background: isSelected ? 'rgba(5,72,47,0.06)' : 'var(--qg-bg-elev)',
                      cursor: 'pointer',
                      transition: 'border-color 120ms, background 120ms',
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 16, fontWeight: 700, color: 'var(--qg-fg-1)' }}>
                        {formatDate(date)} • {block.start} – {block.end}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--qg-fg-4)', marginTop: 2 }}>
                        {block.durationH}h disponíveis para os dois jogadores
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: isSelected ? 'var(--qg-green)' : 'var(--qg-fg-4)' }}>
                      {isSelected ? 'Selecionado ✓' : 'Selecionar'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {proposal && (
            <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 'var(--qg-radius-md)', background: 'var(--qg-bg-elev)', border: '1px solid var(--qg-green)' }}>
              <div style={{ fontSize: 12, color: 'var(--qg-fg-2)', marginBottom: 14 }}>
                Propor a <strong>{opponent}</strong>: <strong>{formatDate(proposal.date)}</strong> das <strong>{proposal.start}</strong> às <strong>{proposal.end}</strong>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 6 }}>
                  Local (quadra)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Residencial 6, Quadra do clube…"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--qg-radius-sm)', border: '1px solid var(--qg-line)', background: 'var(--qg-bg)', color: 'var(--qg-fg-1)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <button
                onClick={sendProposal}
                disabled={sending}
                style={{ padding: '10px 24px', borderRadius: 'var(--qg-radius-sm)', border: 'none', background: 'var(--qg-green)', color: 'var(--qg-cream)', fontWeight: 700, fontSize: 13, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1, letterSpacing: '0.04em' }}
              >
                {sending ? 'Enviando…' : 'Enviar proposta'}
              </button>
            </div>
          )}
        </div>
      )}

      {!hasOverlaps && oppHasAvailability && (
        <div style={{ fontSize: 13, color: 'var(--qg-fg-4)', padding: '20px 0' }}>
          Nenhuma sobreposição encontrada ainda. Ajuste seus horários para encontrar uma janela em comum com {opponent}.
        </div>
      )}

      {canManualPropose && (
        <div style={{ marginTop: 8, padding: '20px 24px', borderRadius: 'var(--qg-radius-md)', background: 'var(--qg-bg-elev)', border: '1px solid var(--qg-line)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 6 }}>
            {opponent} ainda não sinalizou disponibilidade
          </div>
          <div style={{ fontSize: 13, color: 'var(--qg-fg-3)', marginBottom: 20 }}>
            Você pode enviar uma proposta de horário diretamente.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--qg-fg-4)', textTransform: 'uppercase' }}>Dia</span>
              <select
                value={manualDate || days[0]}
                onChange={e => setManualDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 'var(--qg-radius-sm)', border: '1px solid var(--qg-line)', background: 'var(--qg-bg)', color: 'var(--qg-fg-1)', fontSize: 13, cursor: 'pointer' }}
              >
                {days.map(d => <option key={d} value={d}>{formatDate(d)}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--qg-fg-4)', textTransform: 'uppercase' }}>Hora de início</span>
              <select
                value={manualHour}
                onChange={e => setManualHour(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 'var(--qg-radius-sm)', border: '1px solid var(--qg-line)', background: 'var(--qg-bg)', color: 'var(--qg-fg-1)', fontSize: 13, cursor: 'pointer' }}
              >
                {HOURS.slice(0, 14).map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <button
              onClick={sendManualProposal}
              disabled={sending}
              style={{ padding: '9px 20px', borderRadius: 'var(--qg-radius-sm)', border: 'none', background: 'var(--qg-green)', color: 'var(--qg-cream)', fontWeight: 700, fontSize: 13, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1, letterSpacing: '0.04em' }}
            >
              {sending ? 'Enviando…' : `Propor ${manualHour} – ${manualEndHour}`}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
