import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  MessageSquareWarning,
  Plus,
  ArrowUp,
  ArrowDown,
  MapPin,
  UploadCloud,
  Sparkles,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../hooks/useAuth';
import { ImageOptimizer } from '../ImageOptimizer';
import { AlbumCommentPin, AlbumSpread } from '../../types';
import { uploadStudioPhoto } from '../../services/uploadService';
import { triggerDirectPhotoDownload } from '../../lib/cloudinary';

export const WeddingAlbumDesigner: React.FC = () => {
  const { studio, photos, addPhotosBatch, albumDraft, updateAlbumDraft } = useAuth();
  const [activeSpreadIndex, setActiveSpreadIndex] = useState<number>(0);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [clientRevisionInput, setClientRevisionInput] = useState<string>(albumDraft.clientFeedback);
  const [pinModeActive, setPinModeActive] = useState<boolean>(false);
  const [pinNoteDraft, setPinNoteDraft] = useState<string>('Brighten bride skin tone slightly here');
  const [pinAuthorDraft, setPinAuthorDraft] = useState<string>('Aanya Mehra (Bride)');
  const [uploadingToSpread, setUploadingToSpread] = useState<boolean>(false);
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
      title: `Spread 0${spreads.length + 1} — Luxury Panoramic Story`,
      layout: 'panoramic_grid',
      backgroundHex: '#0F172A',
      caption: 'Handcrafted Italian Linen Wedding Monograph',
      photoIds: [
        photos[0]?.id || 'ph_101',
        photos[1]?.id || 'ph_102',
        photos[2]?.id || 'ph_103',
        photos[3]?.id || 'ph_104',
      ],
      zoom: 100,
      panX: 0,
      panY: 0,
      pins: [],
    };
    updateAlbumDraft({ spreads: [...spreads, newSpread] });
    setActiveSpreadIndex(spreads.length);
    setStatusToast('Added new luxury spread to the wedding album.');
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

  const handleAssignPhotoToSlot = (slotIdx: number, photoId: string) => {
    const nextIds = [...currentSpread.photoIds];
    while (nextIds.length <= slotIdx) {
      nextIds.push(photos[0]?.id || 'ph_101');
    }
    nextIds[slotIdx] = photoId;
    handleUpdateCurrentSpread({ photoIds: nextIds });
    setStatusToast(`Assigned photo to Spread Slot #${slotIdx + 1}.`);
  };

  const handleDirectCloudinarySpreadUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingToSpread(true);
    try {
      const uploaded = await uploadStudioPhoto({
        file,
        studioId: studio.id,
        projectId: 'proj_udaipur_royal',
        galleryId: albumDraft.galleryId || 'gal_udaipur_main',
        ownerId: studio.ownerId,
        category: 'Album Spreads',
      });
      await addPhotosBatch([uploaded]);
      handleAssignPhotoToSlot(activeSlotIndex, uploaded.id);
      setStatusToast(
        `Uploaded "${uploaded.fileName}" to Cloudinary (dxeuzdwkz) and placed in Slot #${activeSlotIndex + 1}.`
      );
    } catch (err) {
      setStatusToast(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingToSpread(false);
    }
  };

  const handleCanvasClickForPin = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinModeActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const newPin: AlbumCommentPin = {
      id: `pin_${Date.now()}`,
      x,
      y,
      author: pinAuthorDraft || 'Client',
      note: pinNoteDraft || 'Adjust framing here',
    };
    const existingPins = currentSpread.pins || [];
    handleUpdateCurrentSpread({ pins: [...existingPins, newPin] });
    setPinModeActive(false);
    setStatusToast(`Dropped client comment pin at (${x}%, ${y}%) on ${currentSpread.title}.`);
  };

  const handleRemovePin = (pinId: string) => {
    const existingPins = currentSpread.pins || [];
    handleUpdateCurrentSpread({ pins: existingPins.filter((p) => p.id !== pinId) });
  };

  const handleExportAlbumPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    spreads.forEach((sp, idx) => {
      if (idx > 0) doc.addPage();
      const isDark = sp.backgroundHex === '#0F172A' || sp.backgroundHex === '#0B0F17';
      doc.setFillColor(isDark ? 11 : 248, isDark ? 15 : 246, isDark ? 23 : 240);
      doc.rect(0, 0, 297, 210, 'F');
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.6);
      doc.rect(10, 10, 277, 190);
      doc.setTextColor(isDark ? 245 : 20, isDark ? 208 : 20, isDark ? 120 : 20);
      doc.setFontSize(22);
      doc.text(`${albumDraft.albumTitle} — ${sp.title}`, 20, 30);
      doc.setFontSize(12);
      doc.text(
        `Couple: ${albumDraft.coupleNames} | Cover Material: ${albumDraft.coverFinish} | Approval: ${albumDraft.status.toUpperCase()}`,
        20,
        44
      );
      doc.setFontSize(11);
      doc.text(
        `Template: ${sp.layout.toUpperCase()} | Zoom: ${sp.zoom || 100}% | Pan: (${sp.panX || 0}px, ${sp.panY || 0}px)`,
        20,
        56
      );
      doc.text(`Engraved Caption: "${sp.caption}"`, 20, 68);
      doc.text(`Assigned Cloudinary Assets: ${sp.photoIds.join(', ')}`, 20, 80);
      if (sp.pins && sp.pins.length > 0) {
        doc.text(
          `Client Proofing Pins (${sp.pins.length}): ${sp.pins.map((p) => `${p.author}: "${p.note}"`).join(' | ')}`,
          20,
          94
        );
      }
      doc.text(
        `Produced via ${studio.studioName} · Lumina Studio OS (${studio.customDomain})`,
        20,
        188
      );
    });
    doc.save(`${albumDraft.albumTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Print_Proof.pdf`);
    setStatusToast('Exported high-resolution Wedding Album Print Proof PDF.');
  };

  const slotCount =
    currentSpread.layout === 'cover' || currentSpread.layout === 'single_bleed'
      ? 1
      : currentSpread.layout === 'dual_portrait'
      ? 2
      : currentSpread.layout === 'editorial_trio'
      ? 3
      : 4;

  const spreadPhotos = Array.from({ length: slotCount }).map((_, idx) => {
    const pid = currentSpread.photoIds[idx];
    return photos.find((p) => p.id === pid) || photos[idx % Math.max(1, photos.length)];
  });

  const zoomVal = currentSpread.zoom ?? 100;
  const panXVal = currentSpread.panX ?? 0;
  const panYVal = currentSpread.panY ?? 0;

  return (
    <div className="bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-6 text-slate-100 shadow-2xl">
      {/* Top Luxury Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/20 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300/90 mb-1">
            <span className="font-semibold uppercase tracking-widest">
              MODULE A · INTERACTIVE WEDDING ALBUM DESIGNER
            </span>
            <span>·</span>
            <span>Cover: {albumDraft.coverFinish}</span>
            <span>·</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                albumDraft.status === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {albumDraft.status === 'approved'
                ? 'APPROVED FOR PRINT'
                : albumDraft.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-editorial font-semibold text-white">
            {albumDraft.albumTitle} — {albumDraft.coupleNames}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleAddSpread}
            className="px-3.5 py-2 text-xs font-semibold bg-[#161F33] border border-amber-500/35 rounded-xl text-amber-200 hover:bg-amber-500/15 inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Add Spread</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextStatus =
                albumDraft.status === 'approved' ? 'awaiting_client_review' : 'approved';
              updateAlbumDraft({ status: nextStatus });
              setStatusToast(
                nextStatus === 'approved'
                  ? 'Album Approved for Print! Ready for lab bindery.'
                  : 'Album reopened for client proofing.'
              );
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all ${
              albumDraft.status === 'approved'
                ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                : 'bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-white shadow-md'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {albumDraft.status === 'approved'
                ? 'Approved for Print ✓'
                : 'Approve Album for Print'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportAlbumPdf}
            className="px-4 py-2 text-xs font-semibold bg-white text-[#0B0F17] rounded-xl hover:bg-amber-100 inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Album PDF</span>
          </button>
        </div>
      </div>

      {statusToast && (
        <div className="p-3.5 bg-amber-500/15 border border-amber-400/40 rounded-xl text-xs text-amber-200 flex items-center justify-between">
          <span>{statusToast}</span>
          <button
            type="button"
            onClick={() => setStatusToast('')}
            className="text-amber-300 font-bold hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Spreads Navigator & Cloudinary Filmstrip */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-[#0B0F17] border border-amber-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-200">
              <span>Cover &amp; Spreads ({spreads.length})</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveSpread(-1)}
                  disabled={activeSpreadIndex === 0}
                  className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30"
                  aria-label="Move spread up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveSpread(1)}
                  disabled={activeSpreadIndex === spreads.length - 1}
                  className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30"
                  aria-label="Move spread down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {spreads.map((sp, idx) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => {
                    setActiveSpreadIndex(idx);
                    setActiveSlotIndex(0);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    idx === activeSpreadIndex
                      ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/10 text-amber-200 border-amber-400/60 shadow-sm'
                      : 'bg-[#131B2E] text-slate-300 border-slate-800 hover:border-amber-500/30'
                  }`}
                >
                  <div className="font-semibold truncate">{sp.title}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>
                      Page {sp.pageNumber} · {sp.layout.replace(/_/g, ' ')}
                    </span>
                    {sp.pins && sp.pins.length > 0 && (
                      <span className="text-amber-300 font-mono">
                        {sp.pins.length} Pin(s)
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Drag-and-Drop Cloudinary Photo Bin */}
          <div className="bg-[#0B0F17] border border-amber-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-200">
                Cloudinary Photo Strip (Drag to Slot)
              </span>
              <label
                htmlFor="album-cloudinary-upload"
                className="text-[11px] font-semibold text-amber-400 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{uploadingToSpread ? 'Uploading...' : '+ Upload'}</span>
                <input
                  id="album-cloudinary-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleDirectCloudinarySpreadUpload}
                  className="sr-only"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Drag any photo onto a spread slot or click a photo to place it in Active Slot #
              {activeSlotIndex + 1}.
            </p>
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
              {photos.map((ph) => (
                <button
                  key={ph.id}
                  type="button"
                  draggable
                  onDragStart={() => setDraggedPhotoId(ph.id)}
                  onClick={() => handleAssignPhotoToSlot(activeSlotIndex, ph.id)}
                  title={`Click or drag ${ph.fileName} into Slot #${activeSlotIndex + 1}`}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-slate-700 hover:border-amber-400 focus:outline-none"
                >
                  <ImageOptimizer
                    src={ph.thumbnailUrl}
                    alt={ph.fileName}
                    className="w-full h-full"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-white px-1 py-0.5 truncate">
                    {ph.fileName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Interactive Spread Preview Canvas */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#0B0F17] border border-amber-500/20 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-amber-300 font-semibold">Active Slot:</span>
              {Array.from({ length: slotCount }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlotIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors ${
                    activeSlotIndex === idx
                      ? 'bg-amber-500 text-[#0B0F17] font-bold'
                      : 'bg-[#161F33] text-slate-300 hover:text-white'
                  }`}
                >
                  Slot #{idx + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPinModeActive((p) => !p)}
              className={`px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1.5 transition-colors ${
                pinModeActive
                  ? 'bg-amber-400 text-[#0B0F17]'
                  : 'bg-[#161F33] text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {pinModeActive ? 'Click Spread to Drop Pin' : '+ Add Client Comment Pin'}
              </span>
            </button>
          </div>

          <div
            onClick={handleCanvasClickForPin}
            className={`relative rounded-2xl border border-amber-500/35 p-6 md:p-8 min-h-[430px] flex flex-col justify-between shadow-2xl transition-colors ${
              pinModeActive ? 'cursor-crosshair ring-2 ring-amber-400' : ''
            }`}
            style={{
              backgroundColor: currentSpread.backgroundHex,
              color:
                currentSpread.backgroundHex === '#0F172A' ||
                currentSpread.backgroundHex === '#0B0F17'
                  ? '#F8FAFC'
                  : '#0F172A',
            }}
          >
            {/* Spread Center Fold Crease Line */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-4 left-1/2 w-[1px] bg-current/15 z-10"
            />

            <div className="flex items-center justify-between text-xs opacity-75 border-b border-current/15 pb-3">
              <span className="font-mono uppercase tracking-widest">
                {albumDraft.coupleNames} · Spread {currentSpread.pageNumber}
              </span>
              <span className="font-serif-editorial italic">{albumDraft.coverFinish}</span>
            </div>

            {/* 5 Luxury Spread Layouts */}
            <div className="my-6 relative">
              {currentSpread.layout === 'cover' || currentSpread.layout === 'single_bleed' ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedPhotoId) handleAssignPhotoToSlot(0, draggedPhotoId);
                  }}
                  onClick={() => setActiveSlotIndex(0)}
                  className={`aspect-[16/9] rounded-xl overflow-hidden border-2 transition-all ${
                    activeSlotIndex === 0 ? 'border-amber-400' : 'border-current/15'
                  }`}
                >
                  {spreadPhotos[0] && (
                    <div
                      className="w-full h-full transition-transform duration-200"
                      style={{
                        transform: `scale(${zoomVal / 100}) translate(${panXVal}px, ${panYVal}px)`,
                      }}
                    >
                      <ImageOptimizer
                        src={spreadPhotos[0].secureUrl}
                        alt={spreadPhotos[0].fileName}
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              ) : currentSpread.layout === 'dual_portrait' ? (
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1].map((slot) => {
                    const ph = spreadPhotos[slot];
                    return (
                      <div
                        key={slot}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedPhotoId) handleAssignPhotoToSlot(slot, draggedPhotoId);
                        }}
                        onClick={() => setActiveSlotIndex(slot)}
                        className={`aspect-[3/4] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          activeSlotIndex === slot ? 'border-amber-400' : 'border-current/15'
                        }`}
                      >
                        {ph && (
                          <div
                            className="w-full h-full transition-transform duration-200"
                            style={{
                              transform:
                                activeSlotIndex === slot
                                  ? `scale(${zoomVal / 100}) translate(${panXVal}px, ${panYVal}px)`
                                  : undefined,
                            }}
                          >
                            <ImageOptimizer
                              src={ph.secureUrl}
                              alt={ph.fileName}
                              className="w-full h-full"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : currentSpread.layout === 'editorial_trio' ? (
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((slot) => {
                    const ph = spreadPhotos[slot];
                    return (
                      <div
                        key={slot}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedPhotoId) handleAssignPhotoToSlot(slot, draggedPhotoId);
                        }}
                        onClick={() => setActiveSlotIndex(slot)}
                        className={`aspect-[4/3] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          activeSlotIndex === slot ? 'border-amber-400' : 'border-current/15'
                        }`}
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
                /* Panoramic Grid (4-Slot Asymmetrical Luxury Spread) */
                <div className="grid grid-cols-12 gap-3">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedPhotoId) handleAssignPhotoToSlot(0, draggedPhotoId);
                    }}
                    onClick={() => setActiveSlotIndex(0)}
                    className={`col-span-7 aspect-[4/3] rounded-xl overflow-hidden border-2 cursor-pointer ${
                      activeSlotIndex === 0 ? 'border-amber-400' : 'border-current/15'
                    }`}
                  >
                    {spreadPhotos[0] && (
                      <ImageOptimizer
                        src={spreadPhotos[0].secureUrl}
                        alt={spreadPhotos[0].fileName}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  <div className="col-span-5 grid grid-rows-2 gap-3">
                    {[1, 2].map((slot) => (
                      <div
                        key={slot}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedPhotoId) handleAssignPhotoToSlot(slot, draggedPhotoId);
                        }}
                        onClick={() => setActiveSlotIndex(slot)}
                        className={`aspect-[16/9] rounded-xl overflow-hidden border-2 cursor-pointer ${
                          activeSlotIndex === slot ? 'border-amber-400' : 'border-current/15'
                        }`}
                      >
                        {spreadPhotos[slot] && (
                          <ImageOptimizer
                            src={spreadPhotos[slot].secureUrl}
                            alt={spreadPhotos[slot].fileName}
                            className="w-full h-full"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedPhotoId) handleAssignPhotoToSlot(3, draggedPhotoId);
                    }}
                    onClick={() => setActiveSlotIndex(3)}
                    className={`col-span-12 aspect-[21/6] rounded-xl overflow-hidden border-2 cursor-pointer ${
                      activeSlotIndex === 3 ? 'border-amber-400' : 'border-current/15'
                    }`}
                  >
                    {spreadPhotos[3] && (
                      <ImageOptimizer
                        src={spreadPhotos[3].secureUrl}
                        alt={spreadPhotos[3].fileName}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Rendered Client Comment Pins */}
              {(currentSpread.pins || []).map((pin, idx) => (
                <div
                  key={pin.id}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                >
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleRemovePin(pin.id);
                    }}
                    title="Click to resolve/remove pin"
                    className="w-6 h-6 rounded-full bg-amber-400 text-[#0B0F17] text-[11px] font-bold flex items-center justify-center shadow-lg ring-2 ring-white"
                  >
                    {idx + 1}
                  </button>
                  <div className="hidden group-hover:block absolute left-7 top-0 w-48 p-2 rounded-lg bg-[#0B0F17] text-white text-[11px] border border-amber-400/50 shadow-xl z-30">
                    <div className="font-bold text-amber-300">{pin.author}</div>
                    <div>{pin.note}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-current/10">
              <p className="font-serif-editorial text-lg italic">{currentSpread.caption}</p>
              {spreadPhotos[activeSlotIndex] && (
                <button
                  type="button"
                  onClick={() =>
                    triggerDirectPhotoDownload(
                      spreadPhotos[activeSlotIndex].secureUrl,
                      spreadPhotos[activeSlotIndex].fileName
                    )
                  }
                  className="text-[11px] font-mono underline opacity-80 hover:opacity-100"
                >
                  Download Active Slot Original
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Inspector: Templates, Zoom/Pan, Pins & Client Proofing Notes */}
        <div className="lg:col-span-3 bg-[#0B0F17] border border-amber-500/20 rounded-xl p-4 space-y-4 text-xs">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Luxury Spread Inspector</span>
          </div>

          <div>
            <label htmlFor="spread-title-input" className="block font-medium text-slate-300 mb-1">
              Spread Title
            </label>
            <input
              id="spread-title-input"
              type="text"
              value={currentSpread.title}
              onChange={(e) => handleUpdateCurrentSpread({ title: e.target.value })}
              className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label htmlFor="spread-layout-select" className="block font-medium text-slate-300 mb-1">
              Luxury Spread Template (5 Presets)
            </label>
            <select
              id="spread-layout-select"
              value={currentSpread.layout}
              onChange={(e) =>
                handleUpdateCurrentSpread({ layout: e.target.value as AlbumSpread['layout'] })
              }
              className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
            >
              <option value="cover">Front &amp; Back Cover (Italian Linen)</option>
              <option value="single_bleed">Single Bleed Panorama</option>
              <option value="dual_portrait">Dual Portrait Fine-Art</option>
              <option value="editorial_trio">Editorial Trio Story</option>
              <option value="panoramic_grid">Panoramic Grid (4-Photo Asymmetric)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="spread-bg-select" className="block font-medium text-slate-300 mb-1">
                Matting Board
              </label>
              <select
                id="spread-bg-select"
                value={currentSpread.backgroundHex}
                onChange={(e) => handleUpdateCurrentSpread({ backgroundHex: e.target.value })}
                className="w-full px-2.5 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
              >
                <option value="#0F172A">Obsidian Matte</option>
                <option value="#F8FAFC">Italian Linen Ivory</option>
                <option value="#F1F5F9">Warm Travertine</option>
              </select>
            </div>
            <div>
              <label htmlFor="spread-photo-select" className="block font-medium text-slate-300 mb-1">
                Slot #{activeSlotIndex + 1} Photo
              </label>
              <select
                id="spread-photo-select"
                value={currentSpread.photoIds[activeSlotIndex] || ''}
                onChange={(e) => handleAssignPhotoToSlot(activeSlotIndex, e.target.value)}
                className="w-full px-2.5 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
              >
                {photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fileName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Zoom & Pan Sliders */}
          <div className="p-3 bg-[#131B2E] border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-200">
              <span>Slot Zoom &amp; Pan Adjustments</span>
              <button
                type="button"
                onClick={() => handleUpdateCurrentSpread({ zoom: 100, panX: 0, panY: 0 })}
                className="text-amber-400 hover:underline"
              >
                Reset
              </button>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Zoom</span>
                <span className="font-mono">{zoomVal}%</span>
              </div>
              <input
                type="range"
                min={100}
                max={180}
                value={zoomVal}
                onChange={(e) => handleUpdateCurrentSpread({ zoom: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Pan X</span>
                  <span className="font-mono">{panXVal}px</span>
                </div>
                <input
                  type="range"
                  min={-60}
                  max={60}
                  value={panXVal}
                  onChange={(e) => handleUpdateCurrentSpread({ panX: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Pan Y</span>
                  <span className="font-mono">{panYVal}px</span>
                </div>
                <input
                  type="range"
                  min={-60}
                  max={60}
                  value={panYVal}
                  onChange={(e) => handleUpdateCurrentSpread({ panY: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="spread-caption-input" className="block font-medium text-slate-300 mb-1">
              Gold-Foil Engraved Caption
            </label>
            <input
              id="spread-caption-input"
              type="text"
              value={currentSpread.caption}
              onChange={(e) => handleUpdateCurrentSpread({ caption: e.target.value })}
              className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
            />
          </div>

          {/* Client Comment Pin Creator */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-200">Client Comment Pin Note</span>
              <span className="text-[11px] text-slate-400">
                {(currentSpread.pins || []).length} active
              </span>
            </div>
            <input
              type="text"
              value={pinAuthorDraft}
              onChange={(e) => setPinAuthorDraft(e.target.value)}
              placeholder="Client Name"
              className="w-full px-2.5 py-1.5 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
            />
            <input
              type="text"
              value={pinNoteDraft}
              onChange={(e) => setPinNoteDraft(e.target.value)}
              placeholder="Pin comment (then click 'Add Client Comment Pin')"
              className="w-full px-2.5 py-1.5 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
            />
          </div>

          {/* Overall Client Revision Request */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label htmlFor="client-revision-notes" className="block font-semibold text-amber-200">
              Overall Album Proofing Feedback
            </label>
            <textarea
              id="client-revision-notes"
              rows={2}
              value={clientRevisionInput}
              onChange={(e) => setClientRevisionInput(e.target.value)}
              className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
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
              className="w-full py-2 bg-amber-600/90 text-white font-semibold rounded-lg hover:bg-amber-500 inline-flex items-center justify-center gap-1.5"
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
