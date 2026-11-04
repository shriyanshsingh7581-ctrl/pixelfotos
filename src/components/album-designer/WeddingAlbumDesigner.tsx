import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  MessageSquareWarning,
  Plus,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../hooks/useAuth';
import { ImageOptimizer } from '../ImageOptimizer';
import { AlbumSpread } from '../../types';

export const WeddingAlbumDesigner: React.FC = () => {
  const { studio, photos, albumDraft, updateAlbumDraft } = useAuth();
  const [activeSpreadIndex, setActiveSpreadIndex] = useState<number>(0);
  const [clientRevisionInput, setClientRevisionInput] = useState<string>(albumDraft.clientFeedback);
  const [statusToast, setStatusToast] = useState<string>('');

  const spreads = albumDraft.spreads;
  const currentSpread: AlbumSpread = spreads[activeSpreadIndex] || spreads[0];

  const handleUpdateCurrentSpread = (patch: Partial<AlbumSpread>) => {
    const updatedSpreads = spreads.map((sp, i) =>
      i === activeSpreadIndex ? { ...sp, ...patch } : sp
    );
    updateAlbumDraft({ spreads: updatedSpreads });
  };

  const handleAddSpread = () => {
    const newSpread: AlbumSpread = {
      id: `sp_${Date.now()}`,
      pageNumber: spreads.length + 1,
      title: `Spread 0${spreads.length} — Custom Story Spread`,
      layout: 'dual_portrait',
      backgroundHex: '#F8FAFC',
      caption: 'Handcrafted fine-art wedding spread',
      photoIds: [photos[0]?.id || 'ph_101', photos[1]?.id || 'ph_102'],
    };
    updateAlbumDraft({ spreads: [...spreads, newSpread] });
    setActiveSpreadIndex(spreads.length);
    setStatusToast('Added new album spread.');
  };

  const handleMoveSpread = (direction: -1 | 1) => {
    const targetIndex = activeSpreadIndex + direction;
    if (targetIndex < 0 || targetIndex >= spreads.length) return;
    const copy = [...spreads];
    const [moved] = copy.splice(activeSpreadIndex, 1);
    copy.splice(targetIndex, 0, moved);
    const renumbered = copy.map((sp, idx) => ({ ...sp, pageNumber: idx + 1 }));
    updateAlbumDraft({ spreads: renumbered });
    setActiveSpreadIndex(targetIndex);
  };

  const handleExportAlbumPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    spreads.forEach((sp, idx) => {
      if (idx > 0) doc.addPage();
      doc.setFillColor(sp.backgroundHex === '#0F172A' ? 15 : 248, sp.backgroundHex === '#0F172A' ? 23 : 250, sp.backgroundHex === '#0F172A' ? 42 : 252);
      doc.rect(0, 0, 297, 210, 'F');
      doc.setTextColor(sp.backgroundHex === '#0F172A' ? 255 : 15);
      doc.setFontSize(22);
      doc.text(`${albumDraft.albumTitle} — ${sp.title}`, 20, 30);
      doc.setFontSize(13);
      doc.text(`Couple: ${albumDraft.coupleNames} | Cover Material: ${albumDraft.coverFinish}`, 20, 44);
      doc.setFontSize(11);
      doc.text(`Layout: ${sp.layout} | Caption: "${sp.caption}"`, 20, 56);
      doc.text(`Assigned Photo IDs: ${sp.photoIds.join(', ')}`, 20, 68);
      doc.text(`Designed via ${studio.studioName} (${studio.email})`, 20, 190);
    });
    doc.save(`${albumDraft.albumTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Proof.pdf`);
    setStatusToast('Exported multi-spread Wedding Album Proof PDF.');
  };

  const spreadPhotos = currentSpread.photoIds
    .map((pid) => photos.find((p) => p.id === pid) || photos[0])
    .filter(Boolean);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>{albumDraft.albumTitle}</span>
            <span>·</span>
            <span>Cover: {albumDraft.coverFinish}</span>
            <span>·</span>
            <span>Approval Status: {albumDraft.status.replace(/_/g, ' ')}</span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Interactive Wedding Album Designer &amp; Client Proofing
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleAddSpread}
            className="px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-800 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Add Spread</span>
          </button>

          <button
            type="button"
            onClick={() => {
              updateAlbumDraft({ status: 'approved' });
              setStatusToast('Client approved final wedding album spreads for print production!');
            }}
            className="px-3.5 py-2 text-xs font-medium bg-[#0D9488] text-white rounded-lg hover:bg-teal-700 inline-flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve Album for Print</span>
          </button>

          <button
            type="button"
            onClick={handleExportAlbumPdf}
            className="px-4 py-2 text-xs font-medium bg-[#0F172A] text-white rounded-lg hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Album PDF</span>
          </button>
        </div>
      </div>

      {statusToast && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-950">
          {statusToast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Spreads Navigator */}
        <div className="lg:col-span-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
            <span>Album Spreads ({spreads.length})</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleMoveSpread(-1)}
                disabled={activeSpreadIndex === 0}
                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                aria-label="Move spread up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveSpread(1)}
                disabled={activeSpreadIndex === spreads.length - 1}
                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                aria-label="Move spread down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {spreads.map((sp, idx) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => setActiveSpreadIndex(idx)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                  idx === activeSpreadIndex
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="font-semibold truncate">{sp.title}</div>
                <div
                  className={`mt-0.5 ${
                    idx === activeSpreadIndex ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  Page {sp.pageNumber} · {sp.layout.replace('_', ' ')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center Interactive Spread Preview Canvas */}
        <div className="lg:col-span-6">
          <div
            className="rounded-xl border border-slate-300 p-6 md:p-8 min-h-[380px] flex flex-col justify-between shadow-xs transition-colors"
            style={{
              backgroundColor: currentSpread.backgroundHex,
              color: currentSpread.backgroundHex === '#0F172A' ? '#F8FAFC' : '#0F172A',
            }}
          >
            <div className="flex items-center justify-between text-xs opacity-75 border-b border-current/10 pb-3">
              <span className="font-mono uppercase tracking-widest">
                {albumDraft.coupleNames} · Spread {currentSpread.pageNumber}
              </span>
              <span>{albumDraft.coverFinish}</span>
            </div>

            {/* Spread Layout Grid */}
            <div className="my-6">
              {currentSpread.layout === 'cover' || currentSpread.layout === 'single_bleed' ? (
                <div className="aspect-[16/9] rounded-lg overflow-hidden border border-current/15">
                  {spreadPhotos[0] && (
                    <ImageOptimizer
                      src={spreadPhotos[0].secureUrl}
                      alt={spreadPhotos[0].fileName}
                      className="w-full h-full"
                    />
                  )}
                </div>
              ) : currentSpread.layout === 'dual_portrait' ? (
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1].map((slot) => {
                    const ph = spreadPhotos[slot] || photos[slot] || photos[0];
                    return (
                      <div
                        key={slot}
                        className="aspect-[3/4] rounded-lg overflow-hidden border border-current/15"
                      >
                        {ph && (
                          <ImageOptimizer
                            src={ph.secureUrl}
                            alt={ph.fileName}
                            className="w-full h-full"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((slot) => {
                    const ph = spreadPhotos[slot] || photos[slot] || photos[0];
                    return (
                      <div
                        key={slot}
                        className="aspect-[4/3] rounded-lg overflow-hidden border border-current/15"
                      >
                        {ph && (
                          <ImageOptimizer
                            src={ph.secureUrl}
                            alt={ph.fileName}
                            className="w-full h-full"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="text-center pt-2">
              <p className="font-serif-editorial text-xl italic">{currentSpread.caption}</p>
            </div>
          </div>
        </div>

        {/* Right Inspector: Layout, Typography & Client Revision Notes */}
        <div className="lg:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <BookOpen className="w-4 h-4 text-[#0D9488]" />
            <span>Spread Controls</span>
          </div>

          <div>
            <label htmlFor="spread-title-input" className="block font-medium text-slate-700 mb-1">
              Spread Title
            </label>
            <input
              id="spread-title-input"
              type="text"
              value={currentSpread.title}
              onChange={(e) => handleUpdateCurrentSpread({ title: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="spread-layout-select" className="block font-medium text-slate-700 mb-1">
              Page Template Layout
            </label>
            <select
              id="spread-layout-select"
              value={currentSpread.layout}
              onChange={(e) =>
                handleUpdateCurrentSpread({ layout: e.target.value as AlbumSpread['layout'] })
              }
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
            >
              <option value="cover">Front &amp; Back Cover</option>
              <option value="single_bleed">Full Panorama Bleed</option>
              <option value="dual_portrait">Dual Fine-Art Portrait</option>
              <option value="editorial_trio">Editorial 3-Photo Story</option>
            </select>
          </div>

          <div>
            <label htmlFor="spread-bg-select" className="block font-medium text-slate-700 mb-1">
              Paper &amp; Matting Tone
            </label>
            <select
              id="spread-bg-select"
              value={currentSpread.backgroundHex}
              onChange={(e) => handleUpdateCurrentSpread({ backgroundHex: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
            >
              <option value="#F8FAFC">Museum Cotton White (#F8FAFC)</option>
              <option value="#F1F5F9">Warm Limestone (#F1F5F9)</option>
              <option value="#0F172A">Obsidian Fine-Art Matte (#0F172A)</option>
            </select>
          </div>

          <div>
            <label htmlFor="spread-caption-input" className="block font-medium text-slate-700 mb-1">
              Engraved / Printed Caption
            </label>
            <input
              id="spread-caption-input"
              type="text"
              value={currentSpread.caption}
              onChange={(e) => handleUpdateCurrentSpread({ caption: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="spread-photo-select" className="block font-medium text-slate-700 mb-1">
              Primary Assigned Photo
            </label>
            <select
              id="spread-photo-select"
              value={currentSpread.photoIds[0] || ''}
              onChange={(e) =>
                handleUpdateCurrentSpread({
                  photoIds: [e.target.value, ...currentSpread.photoIds.slice(1)],
                })
              }
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
            >
              {photos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fileName}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            <label htmlFor="client-revision-notes" className="block font-semibold text-slate-900">
              Client Revision Request
            </label>
            <textarea
              id="client-revision-notes"
              rows={3}
              value={clientRevisionInput}
              onChange={(e) => setClientRevisionInput(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                updateAlbumDraft({
                  status: 'revision_requested',
                  clientFeedback: clientRevisionInput,
                });
                setStatusToast('Submitted client revision request to studio album designer.');
              }}
              className="w-full py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 inline-flex items-center justify-center gap-1.5"
            >
              <MessageSquareWarning className="w-3.5 h-3.5" />
              <span>Submit Revision Request</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
