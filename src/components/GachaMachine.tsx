import React, { useState } from 'react';
import { GachaConfig, GachaDropRate, Voucher, GachaCapsuleType } from '../types.ts';
import { firebaseApi } from '../firebase.ts';
import { Sparkles, ChevronRight, Gift, Check, X } from 'lucide-react';
import { XuCaIcon } from './XuCaIcon.tsx';

interface GachaMachineProps {
  authToken: string | null;
  userBalance: number;
  config: GachaConfig | null;
  onBalanceUpdated: (newBalance: number) => void;
  onVoucherCreated?: (voucher: Voucher) => void;
  onOpenVouchersTab?: () => void;
}

// 8 specific inner glyphs required
const INNER_GLYPHS = ['🐟', '🐠', '🐾', '🐱', '🐈‍⬛', '🐈', '❤️', '💖'] as const;

// 4 capsule types
const CAPSULE_TYPES: GachaCapsuleType[] = ['strawberry_milk', 'fish_blue', 'butter_cream', 'pearl_rainbow'];

// 9 Pastel colors for capsule base requested by user
export const GACHA_BASE_PALETTE = [
  '#B0CDE6',
  '#F599C6',
  '#C7D3C0',
  '#F7E49B',
  '#B7B1F2',
  '#E5D9F2',
  '#D2E0FB',
  '#C5B3D3',
  '#B1D3B9',
] as const;

export type GachaBaseColor = typeof GACHA_BASE_PALETTE[number];

// Organic stacked pile layout at the bottom of the chamber
interface ChamberCapsule {
  id: number;
  leftPercent: number;   // % from left
  bottomPercent: number; // % from bottom (concentrated in lower half)
  size: number;
  scale: number;
  rotation: number;
  zIndex: number;        // Higher z-index for lower balls (closer to front/bottom)
  type: GachaCapsuleType;
  baseColor: string;     // One of the 9 pastel colors
  glyph: string;
  swayDelay: number;
  bounceDelay: number;
}

// 71 capsules settling into a dense, natural organic heap filling >2/3 (up to 80%) of the glass dome
// Each layer overlaps the previous by 15-30% area, and z-index reflects front-to-back 3D perspective
const RAW_CHAMBER_CAPSULES: Omit<ChamberCapsule, 'baseColor'>[] = [
  // --- LAYER 1: BED ROW (Touching bottom floor, bottom 2-5%, z-index 95-99) ---
  { id: 1, leftPercent: 3, bottomPercent: 3, size: 51, scale: 1.02, rotation: -18, zIndex: 98, type: 'strawberry_milk', glyph: '🐟', swayDelay: 0.1, bounceDelay: 0.04 },
  { id: 2, leftPercent: 13, bottomPercent: 5, size: 49, scale: 0.98, rotation: 14, zIndex: 96, type: 'fish_blue', glyph: '🐾', swayDelay: 0.5, bounceDelay: 0.12 },
  { id: 3, leftPercent: 23, bottomPercent: 2, size: 52, scale: 1.04, rotation: -24, zIndex: 99, type: 'butter_cream', glyph: '💖', swayDelay: 0.8, bounceDelay: 0.02 },
  { id: 4, leftPercent: 33, bottomPercent: 4, size: 50, scale: 1.01, rotation: 8, zIndex: 97, type: 'pearl_rainbow', glyph: '🐱', swayDelay: 0.3, bounceDelay: 0.16 },
  { id: 5, leftPercent: 43, bottomPercent: 2, size: 52, scale: 0.97, rotation: -12, zIndex: 99, type: 'strawberry_milk', glyph: '🐠', swayDelay: 0.7, bounceDelay: 0.08 },
  { id: 6, leftPercent: 53, bottomPercent: 5, size: 49, scale: 1.03, rotation: 22, zIndex: 96, type: 'fish_blue', glyph: '🐈‍⬛', swayDelay: 0.4, bounceDelay: 0.14 },
  { id: 7, leftPercent: 63, bottomPercent: 3, size: 52, scale: 0.99, rotation: -16, zIndex: 98, type: 'butter_cream', glyph: '❤️', swayDelay: 0.9, bounceDelay: 0.05 },
  { id: 8, leftPercent: 73, bottomPercent: 5, size: 50, scale: 1.02, rotation: 20, zIndex: 96, type: 'pearl_rainbow', glyph: '🐈', swayDelay: 0.25, bounceDelay: 0.18 },
  { id: 9, leftPercent: 83, bottomPercent: 2, size: 51, scale: 0.98, rotation: -22, zIndex: 99, type: 'strawberry_milk', glyph: '🐟', swayDelay: 0.65, bounceDelay: 0.03 },

  // --- LAYER 2: INTERLOCKING LOW MOUND (bottom 11-16%, z-index 85-89) ---
  { id: 10, leftPercent: 7, bottomPercent: 13, size: 50, scale: 0.97, rotation: 22, zIndex: 88, type: 'butter_cream', glyph: '🐾', swayDelay: 0.35, bounceDelay: 0.07 },
  { id: 11, leftPercent: 18, bottomPercent: 15, size: 51, scale: 1.03, rotation: -15, zIndex: 86, type: 'strawberry_milk', glyph: '❤️', swayDelay: 0.65, bounceDelay: 0.15 },
  { id: 12, leftPercent: 28, bottomPercent: 12, size: 49, scale: 0.96, rotation: 25, zIndex: 89, type: 'fish_blue', glyph: '💖', swayDelay: 0.15, bounceDelay: 0.03 },
  { id: 13, leftPercent: 38, bottomPercent: 16, size: 52, scale: 1.04, rotation: -20, zIndex: 85, type: 'pearl_rainbow', glyph: '🐱', swayDelay: 0.75, bounceDelay: 0.19 },
  { id: 14, leftPercent: 48, bottomPercent: 13, size: 48, scale: 0.98, rotation: 18, zIndex: 88, type: 'strawberry_milk', glyph: '🐟', swayDelay: 0.45, bounceDelay: 0.11 },
  { id: 15, leftPercent: 58, bottomPercent: 16, size: 51, scale: 1.01, rotation: -9, zIndex: 85, type: 'butter_cream', glyph: '🐠', swayDelay: 0.85, bounceDelay: 0.06 },
  { id: 16, leftPercent: 68, bottomPercent: 12, size: 49, scale: 0.96, rotation: 27, zIndex: 89, type: 'fish_blue', glyph: '🐈‍⬛', swayDelay: 0.2, bounceDelay: 0.13 },
  { id: 17, leftPercent: 79, bottomPercent: 15, size: 52, scale: 1.02, rotation: -17, zIndex: 86, type: 'pearl_rainbow', glyph: '🐈', swayDelay: 0.55, bounceDelay: 0.09 },

  // --- LAYER 3: MID-LOW MOUND (bottom 21-26%, z-index 75-79) ---
  { id: 18, leftPercent: 3, bottomPercent: 23, size: 50, scale: 1.01, rotation: -26, zIndex: 78, type: 'strawberry_milk', glyph: '🐱', swayDelay: 0.4, bounceDelay: 0.14 },
  { id: 19, leftPercent: 13, bottomPercent: 25, size: 52, scale: 0.98, rotation: 12, zIndex: 76, type: 'fish_blue', glyph: '🐠', swayDelay: 0.8, bounceDelay: 0.04 },
  { id: 20, leftPercent: 23, bottomPercent: 22, size: 49, scale: 1.04, rotation: -18, zIndex: 79, type: 'butter_cream', glyph: '🐟', swayDelay: 0.25, bounceDelay: 0.17 },
  { id: 21, leftPercent: 33, bottomPercent: 26, size: 51, scale: 0.97, rotation: 21, zIndex: 75, type: 'pearl_rainbow', glyph: '❤️', swayDelay: 0.6, bounceDelay: 0.08 },
  { id: 22, leftPercent: 43, bottomPercent: 23, size: 50, scale: 1.02, rotation: -14, zIndex: 78, type: 'strawberry_milk', glyph: '💖', swayDelay: 0.3, bounceDelay: 0.15 },
  { id: 23, leftPercent: 53, bottomPercent: 26, size: 52, scale: 0.99, rotation: 19, zIndex: 75, type: 'fish_blue', glyph: '🐾', swayDelay: 0.9, bounceDelay: 0.06 },
  { id: 24, leftPercent: 63, bottomPercent: 22, size: 48, scale: 1.03, rotation: -22, zIndex: 79, type: 'butter_cream', glyph: '🐈', swayDelay: 0.45, bounceDelay: 0.12 },
  { id: 25, leftPercent: 73, bottomPercent: 25, size: 51, scale: 0.96, rotation: 16, zIndex: 76, type: 'pearl_rainbow', glyph: '🐈‍⬛', swayDelay: 0.15, bounceDelay: 0.18 },
  { id: 26, leftPercent: 83, bottomPercent: 23, size: 50, scale: 1.01, rotation: -10, zIndex: 78, type: 'strawberry_milk', glyph: '🐟', swayDelay: 0.7, bounceDelay: 0.05 },

  // --- LAYER 4: MID MOUND (bottom 31-36%, z-index 65-69) ---
  { id: 27, leftPercent: 8, bottomPercent: 33, size: 49, scale: 0.98, rotation: 19, zIndex: 67, type: 'butter_cream', glyph: '💖', swayDelay: 0.35, bounceDelay: 0.11 },
  { id: 28, leftPercent: 18, bottomPercent: 36, size: 51, scale: 1.03, rotation: -16, zIndex: 65, type: 'fish_blue', glyph: '🐱', swayDelay: 0.75, bounceDelay: 0.07 },
  { id: 29, leftPercent: 28, bottomPercent: 32, size: 50, scale: 0.96, rotation: 24, zIndex: 69, type: 'pearl_rainbow', glyph: '🐟', swayDelay: 0.2, bounceDelay: 0.16 },
  { id: 30, leftPercent: 38, bottomPercent: 35, size: 52, scale: 1.02, rotation: -12, zIndex: 66, type: 'strawberry_milk', glyph: '🐾', swayDelay: 0.65, bounceDelay: 0.02 },
  { id: 31, leftPercent: 48, bottomPercent: 32, size: 49, scale: 0.98, rotation: 23, zIndex: 69, type: 'butter_cream', glyph: '❤️', swayDelay: 0.4, bounceDelay: 0.14 },
  { id: 32, leftPercent: 58, bottomPercent: 36, size: 51, scale: 1.04, rotation: -21, zIndex: 65, type: 'fish_blue', glyph: '🐠', swayDelay: 0.85, bounceDelay: 0.08 },
  { id: 33, leftPercent: 68, bottomPercent: 33, size: 48, scale: 0.97, rotation: 14, zIndex: 68, type: 'pearl_rainbow', glyph: '🐈', swayDelay: 0.1, bounceDelay: 0.17 },
  { id: 34, leftPercent: 78, bottomPercent: 35, size: 50, scale: 1.01, rotation: -25, zIndex: 66, type: 'strawberry_milk', glyph: '🐈‍⬛', swayDelay: 0.5, bounceDelay: 0.05 },

  // --- LAYER 5: MID-HIGH MOUND (bottom 41-46%, z-index 55-59) ---
  { id: 35, leftPercent: 4, bottomPercent: 43, size: 51, scale: 1.02, rotation: -17, zIndex: 57, type: 'fish_blue', glyph: '🐟', swayDelay: 0.3, bounceDelay: 0.13 },
  { id: 36, leftPercent: 14, bottomPercent: 45, size: 49, scale: 0.98, rotation: 20, zIndex: 55, type: 'strawberry_milk', glyph: '💖', swayDelay: 0.7, bounceDelay: 0.06 },
  { id: 37, leftPercent: 24, bottomPercent: 42, size: 52, scale: 1.04, rotation: -15, zIndex: 58, type: 'butter_cream', glyph: '🐾', swayDelay: 0.15, bounceDelay: 0.19 },
  { id: 38, leftPercent: 34, bottomPercent: 46, size: 50, scale: 0.97, rotation: 25, zIndex: 55, type: 'pearl_rainbow', glyph: '🐱', swayDelay: 0.55, bounceDelay: 0.09 },
  { id: 39, leftPercent: 44, bottomPercent: 43, size: 51, scale: 1.01, rotation: -11, zIndex: 57, type: 'strawberry_milk', glyph: '🐠', swayDelay: 0.85, bounceDelay: 0.03 },
  { id: 40, leftPercent: 54, bottomPercent: 46, size: 49, scale: 0.96, rotation: 18, zIndex: 55, type: 'fish_blue', glyph: '❤️', swayDelay: 0.4, bounceDelay: 0.15 },
  { id: 41, leftPercent: 64, bottomPercent: 42, size: 52, scale: 1.03, rotation: -23, zIndex: 58, type: 'butter_cream', glyph: '🐈‍⬛', swayDelay: 0.6, bounceDelay: 0.11 },
  { id: 42, leftPercent: 74, bottomPercent: 45, size: 48, scale: 0.98, rotation: 13, zIndex: 56, type: 'pearl_rainbow', glyph: '🐈', swayDelay: 0.25, bounceDelay: 0.07 },
  { id: 43, leftPercent: 83, bottomPercent: 42, size: 50, scale: 1.02, rotation: -19, zIndex: 58, type: 'strawberry_milk', glyph: '🐟', swayDelay: 0.9, bounceDelay: 0.16 },

  // --- LAYER 6: HIGH MOUND (bottom 51-56%, z-index 45-49) ---
  { id: 44, leftPercent: 8, bottomPercent: 53, size: 50, scale: 0.99, rotation: 21, zIndex: 47, type: 'pearl_rainbow', glyph: '🐾', swayDelay: 0.45, bounceDelay: 0.08 },
  { id: 45, leftPercent: 18, bottomPercent: 55, size: 52, scale: 1.03, rotation: -14, zIndex: 45, type: 'fish_blue', glyph: '🐟', swayDelay: 0.15, bounceDelay: 0.18 },
  { id: 46, leftPercent: 28, bottomPercent: 52, size: 48, scale: 0.96, rotation: 26, zIndex: 48, type: 'butter_cream', glyph: '🐱', swayDelay: 0.65, bounceDelay: 0.04 },
  { id: 47, leftPercent: 38, bottomPercent: 56, size: 51, scale: 1.04, rotation: -18, zIndex: 45, type: 'strawberry_milk', glyph: '💖', swayDelay: 0.35, bounceDelay: 0.12 },
  { id: 48, leftPercent: 48, bottomPercent: 53, size: 50, scale: 0.97, rotation: 15, zIndex: 47, type: 'pearl_rainbow', glyph: '🐠', swayDelay: 0.8, bounceDelay: 0.07 },
  { id: 49, leftPercent: 58, bottomPercent: 56, size: 52, scale: 1.01, rotation: -22, zIndex: 45, type: 'fish_blue', glyph: '❤️', swayDelay: 0.2, bounceDelay: 0.14 },
  { id: 50, leftPercent: 68, bottomPercent: 52, size: 49, scale: 0.98, rotation: 17, zIndex: 48, type: 'butter_cream', glyph: '🐈', swayDelay: 0.75, bounceDelay: 0.02 },
  { id: 51, leftPercent: 78, bottomPercent: 55, size: 51, scale: 1.02, rotation: -12, zIndex: 46, type: 'strawberry_milk', glyph: '🐈‍⬛', swayDelay: 0.5, bounceDelay: 0.16 },

  // --- LAYER 7: UPPER 2/3 THRESHOLD MOUND (bottom 61-66%, z-index 35-39) ---
  { id: 52, leftPercent: 9, bottomPercent: 63, size: 51, scale: 1.02, rotation: -24, zIndex: 38, type: 'butter_cream', glyph: '🐟', swayDelay: 0.3, bounceDelay: 0.11 },
  { id: 53, leftPercent: 19, bottomPercent: 65, size: 49, scale: 0.97, rotation: 16, zIndex: 36, type: 'strawberry_milk', glyph: '🐈', swayDelay: 0.7, bounceDelay: 0.05 },
  { id: 54, leftPercent: 29, bottomPercent: 62, size: 52, scale: 1.03, rotation: -19, zIndex: 39, type: 'pearl_rainbow', glyph: '🐾', swayDelay: 0.2, bounceDelay: 0.17 },
  { id: 55, leftPercent: 40, bottomPercent: 66, size: 48, scale: 0.96, rotation: 22, zIndex: 35, type: 'fish_blue', glyph: '💖', swayDelay: 0.85, bounceDelay: 0.03 },
  { id: 56, leftPercent: 50, bottomPercent: 63, size: 51, scale: 1.04, rotation: -10, zIndex: 38, type: 'butter_cream', glyph: '🐱', swayDelay: 0.4, bounceDelay: 0.15 },
  { id: 57, leftPercent: 60, bottomPercent: 66, size: 50, scale: 0.98, rotation: 25, zIndex: 35, type: 'strawberry_milk', glyph: '🐠', swayDelay: 0.6, bounceDelay: 0.09 },
  { id: 58, leftPercent: 70, bottomPercent: 62, size: 52, scale: 1.01, rotation: -15, zIndex: 39, type: 'fish_blue', glyph: '❤️', swayDelay: 0.15, bounceDelay: 0.13 },
  { id: 59, leftPercent: 79, bottomPercent: 65, size: 49, scale: 0.97, rotation: 18, zIndex: 36, type: 'pearl_rainbow', glyph: '🐈‍⬛', swayDelay: 0.55, bounceDelay: 0.07 },

  // --- LAYER 8: EXTENDING BEYOND 2/3 (bottom 70-74%, z-index 25-28) ---
  { id: 60, leftPercent: 18, bottomPercent: 71, size: 50, scale: 0.98, rotation: 20, zIndex: 27, type: 'fish_blue', glyph: '🐟', swayDelay: 0.45, bounceDelay: 0.12 },
  { id: 61, leftPercent: 34, bottomPercent: 74, size: 52, scale: 1.03, rotation: -22, zIndex: 25, type: 'butter_cream', glyph: '❤️', swayDelay: 0.1, bounceDelay: 0.06 },
  { id: 62, leftPercent: 50, bottomPercent: 71, size: 48, scale: 0.96, rotation: 14, zIndex: 28, type: 'strawberry_milk', glyph: '🐾', swayDelay: 0.8, bounceDelay: 0.18 },
  { id: 63, leftPercent: 66, bottomPercent: 74, size: 51, scale: 1.02, rotation: -16, zIndex: 25, type: 'pearl_rainbow', glyph: '🐱', swayDelay: 0.35, bounceDelay: 0.04 },

  // --- LAYER 9: TOP CROWNING CREST (bottom 77-80%, z-index 15-18) ---
  { id: 64, leftPercent: 32, bottomPercent: 78, size: 50, scale: 1.02, rotation: -18, zIndex: 18, type: 'fish_blue', glyph: '💖', swayDelay: 0.5, bounceDelay: 0.07 },
  { id: 65, leftPercent: 52, bottomPercent: 78, size: 51, scale: 0.98, rotation: 16, zIndex: 16, type: 'strawberry_milk', glyph: '🐈', swayDelay: 0.2, bounceDelay: 0.13 },
];

const DENSE_CHAMBER_CAPSULES: ChamberCapsule[] = RAW_CHAMBER_CAPSULES.map((cap, idx) => ({
  ...cap,
  baseColor: GACHA_BASE_PALETTE[idx % GACHA_BASE_PALETTE.length],
}));

// Super cute Kawaii Sound Synthesizer using Web Audio API (Chic, melodic & cheerful)
class GachaSoundEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Cute music box windup twinkle (replaces harsh crank ratchet)
  public playCrank() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const twinkles = [880.0, 1108.73, 1318.51, 1760.0]; // A5, C#6, E6, A6

    twinkles.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.16, now + i * 0.06 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.3);
    });
  }

  // Playful kawaii bubble pops and rolling xylophone notes in the chamber
  public playTumble() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Bouncy kawaii bubble pops + xylophone melody (poko poko ~ pyu!)
    const notes = [
      { f: 659.25, time: 0.00 },
      { f: 880.00, time: 0.07 },
      { f: 1046.50, time: 0.14 },
      { f: 783.99, time: 0.22 },
      { f: 1174.66, time: 0.30 },
      { f: 1318.51, time: 0.38 },
      { f: 987.77, time: 0.46 },
    ];

    notes.forEach(({ f, time }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      // Upward bubble sweep
      osc.frequency.setValueAtTime(f * 0.85, now + time);
      osc.frequency.exponentialRampToValueAtTime(f * 1.15, now + time + 0.06);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.14, now + time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + 0.2);
    });
  }

  // Bouncy cartoon bubble drop (poyon! ~ ding!)
  public playDispense() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Cute springy slide
    const slide = this.ctx.createOscillator();
    const slideGain = this.ctx.createGain();
    slide.type = 'sine';
    slide.frequency.setValueAtTime(440, now);
    slide.frequency.exponentialRampToValueAtTime(740, now + 0.1);
    slide.frequency.exponentialRampToValueAtTime(587, now + 0.2);

    slideGain.gain.setValueAtTime(0, now);
    slideGain.gain.linearRampToValueAtTime(0.22, now + 0.01);
    slideGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    slide.connect(slideGain);
    slideGain.connect(this.ctx.destination);
    slide.start(now);
    slide.stop(now + 0.25);

    // Cute soft chime bell landing
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'triangle';
    bell.frequency.setValueAtTime(1480, now + 0.14);

    bellGain.gain.setValueAtTime(0, now + 0.14);
    bellGain.gain.linearRampToValueAtTime(0.18, now + 0.14 + 0.005);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    bell.connect(bellGain);
    bellGain.connect(this.ctx.destination);
    bell.start(now + 0.14);
    bell.stop(now + 0.58);
  }

  // Magical fairy sparkle victory chime (sweet, celestial and celebratory)
  public playChime(isRare: boolean = false) {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sweet pop sound
    const pop = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(520, now);
    pop.frequency.exponentialRampToValueAtTime(980, now + 0.05);
    popGain.gain.setValueAtTime(0.25, now);
    popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    pop.connect(popGain);
    popGain.connect(this.ctx.destination);
    pop.start(now);
    pop.stop(now + 0.08);

    // Cheerful kawaii sparkles arpeggio
    const chord = isRare
      ? [783.99, 987.77, 1174.66, 1567.98, 1975.53, 2349.32] // G5, B5, D6, G6, B6, D7 (Magical Rainbow fanfare)
      : [659.25, 783.99, 1046.50, 1318.51, 1567.98]; // E5, G5, C6, E6, G6 (Sweet Kawaii Win)

    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.05 + idx * 0.06);

      // Sweet overtone for starry bell texture
      const shimmer = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(freq * 2, now + 0.05 + idx * 0.06);

      gain.gain.setValueAtTime(0, now + 0.05 + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05 + idx * 0.06 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55 + idx * 0.06);

      shimmerGain.gain.setValueAtTime(0, now + 0.05 + idx * 0.06);
      shimmerGain.gain.linearRampToValueAtTime(0.06, now + 0.05 + idx * 0.06 + 0.005);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35 + idx * 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(this.ctx.destination);

      osc.start(now + 0.05 + idx * 0.06);
      osc.stop(now + 0.6 + idx * 0.06);
      shimmer.start(now + 0.05 + idx * 0.06);
      shimmer.stop(now + 0.4 + idx * 0.06);
    });
  }
}

const soundEngine = new GachaSoundEngine();

export const GachaMachine: React.FC<GachaMachineProps> = ({
  authToken,
  userBalance,
  config,
  onBalanceUpdated,
  onVoucherCreated,
  onOpenVouchersTab,
}) => {
  const [machineState, setMachineState] = useState<'idle' | 'spinning' | 'dispensed' | 'opened'>('idle');
  const [crankRotation, setCrankRotation] = useState(45); // default diagonal angle ~45 deg
  const [isHovered, setIsHovered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [currentReward, setCurrentReward] = useState<GachaDropRate | null>(null);
  const [currentVoucher, setCurrentVoucher] = useState<Voucher | null>(null);
  const [dispensedCapsuleType, setDispensedCapsuleType] = useState<GachaCapsuleType>('strawberry_milk');
  const [dispensedBaseColor, setDispensedBaseColor] = useState<string>('#F599C6');
  const [dispensedGlyph, setDispensedGlyph] = useState<string>('🐟');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Claiming voucher on result modal
  const [isClaimingVoucher, setIsClaimingVoucher] = useState(false);
  const [claimedSuccess, setClaimedSuccess] = useState(false);

  const spinPrice = config?.spinPrice || 20;


  // Helper to determine capsule type from coins
  const resolveCapsuleType = (reward: GachaDropRate): GachaCapsuleType => {
    if (reward.capsuleType) return reward.capsuleType;
    if (reward.coins <= 5) return 'strawberry_milk';
    if (reward.coins <= 10) return 'fish_blue';
    if (reward.coins <= 25) return 'butter_cream';
    return 'pearl_rainbow';
  };

  // Spin sequence
  const handleStartSpin = async () => {
    if (machineState === 'spinning') return;

    if (!authToken) {
      setErrorMessage('Vui lòng đăng nhập để quay Máy Gacha Mèo Mê Cá Khô nha!');
      return;
    }

    if (userBalance < spinPrice) {
      setErrorMessage('Số xu cá của quý khách không đủ quay Gacha, hãy kiếm thêm xu cá nhé -`♡´- ');
      return;
    }

    setErrorMessage(null);
    setMachineState('spinning');
    setClaimedSuccess(false);

    // 1. Play sounds & Rotate diagonal toggle bar
    soundEngine.playCrank();
    setCrankRotation((prev) => prev + 720);

    // 2. Play tumble sound
    setTimeout(() => {
      soundEngine.playTumble();
    }, 250);

    try {
      // 3. Server call
      const res = await firebaseApi('/api/gacha/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi quay máy gacha.');
      }

      const reward: GachaDropRate = data.reward;
      const voucher: Voucher = data.voucher;
      const capType = resolveCapsuleType(reward);
      const randomGlyph = INNER_GLYPHS[Math.floor(Math.random() * INNER_GLYPHS.length)];
      const randomBaseColor = GACHA_BASE_PALETTE[Math.floor(Math.random() * GACHA_BASE_PALETTE.length)];

      setCurrentReward(reward);
      setCurrentVoucher(voucher);
      setDispensedCapsuleType(capType);
      setDispensedGlyph(randomGlyph);
      setDispensedBaseColor(randomBaseColor);
      onBalanceUpdated(data.updatedBalance);
      if (onVoucherCreated) onVoucherCreated(voucher);

      // Keep animation running for tactile experience (1100ms)
      setTimeout(() => {
        // 4. Dispense capsule into chute
        setMachineState('dispensed');
        soundEngine.playDispense();

        // 5. Auto open after 900ms
        setTimeout(() => {
          setMachineState('opened');
          const isRare = capType === 'pearl_rainbow' || capType === 'butter_cream';
          soundEngine.playChime(isRare);
          setIsModalOpen(true);
        }, 900);
      }, 1100);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ gacha.');
      setMachineState('idle');
    }
  };

  // Claim voucher into fish coin wallet from modal
  const handleClaimVoucherNow = async () => {
    if (!authToken || !currentVoucher || isClaimingVoucher || claimedSuccess) return;

    setIsClaimingVoucher(true);
    try {
      const res = await firebaseApi(`/api/vouchers/${currentVoucher.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi quy đổi voucher.');
      }

      setClaimedSuccess(true);
      onBalanceUpdated(data.updatedBalance);
    } catch (err: any) {
      alert(err.message || 'Không thể quy đổi lúc này.');
    } finally {
      setIsClaimingVoucher(false);
    }
  };

  // Close Result Modal
  const handleCloseModal = () => {
    if (isClaimingVoucher) return;
    setIsModalOpen(false);
    setMachineState('idle');
  };

  return (
    <div
      className="w-full flex flex-col items-center select-none py-1"
      style={{ fontFamily: "'Calistoga', serif", fontWeight: 'bold' }}
    >
      <style>{`
        @keyframes retroBreathing {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes retroVibrate {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-3px, 1.5px); }
          50% { transform: translate(3px, -1.5px); }
          75% { transform: translate(-2px, -1px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes denseCapsuleJostle {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-1.5px, -2px) rotate(4deg); }
        }
        @keyframes denseCapsuleJostleAlt {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(2px, -1.5px) rotate(-5deg); }
        }
        @keyframes denseCapsuleBounce {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-5px, -10px) rotate(16deg); }
          50% { transform: translate(4px, -14px) rotate(-20deg); }
          75% { transform: translate(-3px, -5px) rotate(12deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes chuteCapsuleDrop {
          0% { transform: translateY(-45px) scale(0.6); opacity: 0; }
          60% { transform: translateY(4px) scale(1.08); opacity: 1; }
          80% { transform: translateY(-3px) scale(0.96); }
          100% { transform: translateY(0px) scale(1); }
        }
        .retro-machine-breathe {
          animation: retroBreathing 4s ease-in-out infinite;
        }
        .retro-machine-vibrate {
          animation: retroVibrate 0.1s linear infinite;
        }
        .chute-capsule-anim {
          animation: chuteCapsuleDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Top Header Controls: User Balance (Sound toggle removed) */}
      <div className="w-full max-w-[420px] flex items-center justify-end px-2 mb-3">
        <div className="px-3.5 py-1.5 rounded-full bg-[#FFF9F4]/90 backdrop-blur-xs border-2 border-[#795653]/30 text-[#795653] font-black text-xs flex items-center gap-1.5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-[#795653]/80">VÍ CÁ:</span>
          <XuCaIcon className="w-4 h-4 object-contain shrink-0" />
          <span className="text-[#0A5EB0] text-sm tabular-nums">{userBalance}</span>
        </div>
      </div>

      {/* ================= RETRO POSTER GACHA MACHINE STAGE & VERTICAL SHOWCASE ================= */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-5 w-full max-w-2xl lg:max-w-3xl">
        {/* LEFT: GACHA MACHINE STAGE */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative w-full max-w-[380px] sm:max-w-[400px] flex-shrink-0 transition-all duration-300 ${
            isHovered && machineState === 'idle' ? '-translate-y-1' : ''
          }`}
        >
          {/* Machine Shell (Flat 2D Vector Retro Poster Style) */}
          <div
            className={`relative w-full flex flex-col items-center rounded-3xl p-0 m-0 bg-[#FFF9F4] border-[3.5px] border-[#795653] shadow-[6px_6px_0px_#795653] overflow-hidden ${
              machineState === 'spinning' ? 'retro-machine-vibrate' : 'retro-machine-breathe'
            }`}
            style={{ padding: 0 }}
          >
            {/* ================= SECTION 1: TOP RETRO BLOCKY BANNER ================= */}
            <div className="w-full m-0 bg-[#F6A6B8] border-b-[3.5px] border-[#795653] px-3.5 py-2.5 flex items-center justify-between relative overflow-hidden">
              {/* Retro blocky title */}
              <div className="flex flex-col">
                <span
                  className="font-black text-lg sm:text-xl tracking-widest leading-none uppercase"
                  style={{
                    fontFamily: '"Alfa Slab One", cursive, sans-serif',
                    color: '#ffdff2',
                    letterSpacing: '1px',
                    textShadow: '2px 2px 0px #795653',
                  }}
                >
                  gacha may mắn ᯓ★
                </span>
              </div>
            </div>

            {/* ================= SECTION 2: DOME GLASS CHAMBER (55% OF HEIGHT) ================= */}
            <div className="relative w-full m-0 h-[270px] sm:h-[295px] bg-[#FFF9F4] border-b-[3.5px] border-[#795653] overflow-hidden flex items-center justify-center">
              {/* Flat Vector Chamber Outline Graphics (Beveled top corners & curved glass sides) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-30"
                viewBox="0 0 380 280"
                preserveAspectRatio="none"
              >
                {/* Glass reflections: Flat 2D vector white curved highlights */}
                <path
                  d="M 22 28 C 18 60 18 120 25 150 C 27 155 24 165 20 160 C 15 120 14 60 20 25 Z"
                  fill="#FFFFFF"
                  opacity="0.8"
                />
                <path
                  d="M 35 22 C 70 14 160 14 210 20 C 215 21 215 25 210 25 C 160 19 70 19 32 26 Z"
                  fill="#FFFFFF"
                  opacity="0.8"
                />
                {/* Subtle retro center watermark */}
                <text
                  x="190"
                  y="100"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="64"
                  fill="#795653"
                  opacity="0.05"
                  fontWeight="900"
                >
                  𓆜
                </text>
              </svg>

              {/* DENSE CAPSULE CONTAINER: Stacked organic pile concentrated in lower half */}
              <div className="relative w-full h-full">
                {DENSE_CHAMBER_CAPSULES.map((cap) => {
                  const isSpinning = machineState === 'spinning';
                  const swayAnim =
                    cap.id % 2 === 0 ? 'denseCapsuleJostle' : 'denseCapsuleJostleAlt';

                  return (
                    <div
                      key={cap.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${cap.leftPercent}%`,
                        bottom: `${cap.bottomPercent}%`,
                        transform: `scale(${cap.scale}) rotate(${cap.rotation}deg)`,
                        animation: isSpinning
                          ? `denseCapsuleBounce 0.35s ease-in-out infinite ${cap.bounceDelay}s`
                          : `${swayAnim} 3.8s ease-in-out infinite ${cap.swayDelay}s`,
                        zIndex: cap.zIndex,
                      }}
                    >
                      <FlatVectorCapsule
                        type={cap.type}
                        baseColor={cap.baseColor}
                        size={cap.size}
                        glyph={cap.glyph}
                      />
                    </div>
                  );
                })}

                {/* Spinning Overlay when active */}
                {machineState === 'spinning' && (
                  <div className="absolute inset-0 bg-[#FFF9F4]/20 backdrop-blur-[0.5px] z-40 flex flex-col items-center justify-center">
                    <div className="px-3.5 py-1.5 rounded-lg bg-[#FFF9F4] border-2 border-[#795653] shadow-[3px_3px_0px_#795653] flex items-center gap-1.5 animate-pulse">
                      <span className="text-xs">⚡</span>
                      <span className="text-xs font-black text-[#795653] uppercase tracking-wider">
                        ĐANG XÁO TRỘN CAPSULE...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================= SECTION 3: LOWER CONTROL PANEL (2-COLUMN LEFT - RIGHT LAYOUT) ================= */}
            <div className="w-full m-0 bg-[#F6A6B8] p-4 sm:p-5 grid grid-cols-2 gap-4 items-stretch relative">
              {/* LEFT COLUMN: Coin Slot Circle Button (Top) + Dome-Shaped Dispense Chute (Bottom) */}
              <div className="flex flex-col items-center justify-between gap-3">
                {/* Top: Circular Coin Slot Button (Shrunk down further) */}
                <div className="flex flex-col items-center justify-center my-auto">
                  <button
                    type="button"
                    disabled={machineState === 'spinning'}
                    onClick={handleStartSpin}
                    className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FF84BA] hover:bg-[#ff6fae] border-[3px] border-[#795653] shadow-[2.5px_2.5px_0px_#795653] flex items-center justify-center cursor-pointer active:scale-95 transition-all group"
                    title="Nhấn để nhét xu cá quay gacha!"
                  >
                    {/* White inner circle */}
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-[#795653] flex items-center justify-center relative shadow-inner">
                      {/* Vertical slot slit */}
                      <div className="w-1 h-3.5 sm:h-4 rounded-full bg-[#795653]" />
                    </div>
                  </button>
                </div>

                {/* Bottom: Dome-Shaped Dispense Chute (Elevated Height: h-32 sm:h-36) */}
                <div className="w-full flex flex-col items-center relative">
                  {/* Outer Dome Chute Frame: Full #FBEFEF background, elevated height */}
                  <div
                    className="w-full max-w-[175px] rounded-t-full rounded-b-2xl bg-[#FBEFEF] border-[3.5px] border-[#795653] shadow-[3px_3px_0px_#795653] flex flex-col items-center justify-center relative overflow-hidden p-2 text-center"
                    style={{ width: '170.06px', height: '159.991px' }}
                  >
                    {/* Decorative Stars & Tiny Fish around chute */}
                    <span className="absolute top-2.5 left-2.5 text-[10px] text-[#F891BB] pointer-events-none">✨</span>
                    <span className="absolute top-3.5 right-2.5 text-[10px] text-[#795653] pointer-events-none">𓆜</span>
                    <span className="absolute bottom-2.5 left-2.5 text-[10px] text-[#795653]/60 pointer-events-none">✦</span>
                    <span className="absolute bottom-2.5 right-2.5 text-[10px] text-[#F891BB] pointer-events-none">🌸</span>

                    {/* Dispensed Capsule State vs Idle Dome Chute Text */}
                    {machineState === 'dispensed' || machineState === 'opened' ? (
                      <div
                        onClick={() => {
                          setMachineState('opened');
                          setIsModalOpen(true);
                          soundEngine.playChime(dispensedCapsuleType === 'pearl_rainbow');
                        }}
                        className="cursor-pointer chute-capsule-anim flex flex-col items-center justify-center gap-1 px-2.5 py-1.5 bg-[#FFF9F4] rounded-xl border-2 border-[#795653] shadow-[2px_2px_0px_#795653] hover:scale-105 transition-transform z-10"
                        title="Nhấn để mở capsule nhận thưởng!"
                      >
                        <FlatVectorCapsule
                          type={dispensedCapsuleType}
                          baseColor={dispensedBaseColor}
                          size={48}
                          glyph={dispensedGlyph}
                        />
                        <span className="text-[10px] font-black text-[#A6536A] animate-pulse uppercase tracking-tight">
                          MỞ QUÀ ✨
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center z-10 px-1">
                        <span
                          className="font-bold tracking-wide leading-tight"
                          style={{
                            fontFamily: "'Calistoga', serif",
                            color: '#F891BB',
                            fontWeight: 'bold',
                            fontStyle: 'normal',
                            fontSize: '16px',
                            marginTop: '6px',
                          }}
                        >
                          ୨ৎ ô nhận bóng ୨ৎ
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Enlarged White Crank Knob (w-28 h-28 sm:w-34 sm:h-34) + Price Badge */}
              <div className="flex flex-col items-center justify-between gap-3">
                {/* Top: Enlarged White Crank Knob with Pink Handle Bar (#FF84BA) */}
                <div className="relative flex flex-col items-center justify-center my-auto">
                  {/* Large Knob Outer Socket */}
                  <div className="relative w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-[#FFF9F4] border-[3.5px] border-[#795653] shadow-[3.5px_3.5px_0px_#795653] flex items-center justify-center p-1.5">
                    {/* Interactive White Turning Knob */}
                    <button
                      type="button"
                      disabled={machineState === 'spinning'}
                      onClick={handleStartSpin}
                      className="relative w-full h-full rounded-full bg-white hover:bg-[#FFF9F4] border-[3px] border-[#795653] flex items-center justify-center cursor-pointer active:scale-95 transition-all group"
                      title="Nhấn hoặc xoay núm để nhận capsule!"
                    >
                      {/* Central Handle Bar / Dải gạt chéo màu hồng #FF84BA */}
                      <div
                        className="w-18 sm:w-22 h-5.5 sm:h-6.5 rounded-full bg-[#FF84BA] border-2 border-[#795653] flex items-center justify-between px-2 transition-transform duration-700 shadow-xs"
                        style={{
                          transform: `rotate(${crankRotation}deg)`,
                          transition:
                            machineState === 'spinning'
                              ? 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
                              : 'transform 0.25s ease',
                        }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-white border border-[#795653]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white border border-[#795653]" />
                      </div>

                      {/* Center Pin */}
                      <div className="absolute w-4.5 h-4.5 rounded-full bg-[#FF84BA] border-2 border-[#795653] pointer-events-none" />
                    </button>
                  </div>
                </div>

                {/* Bottom: Price Box "20 xu cá / lượt" */}
                <div className="w-full flex justify-center">
                  <div className="w-full max-w-[155px] sm:max-w-[175px] px-2 py-2 rounded-xl bg-[#FFF9F4] border-[3px] border-[#795653] shadow-[3px_3px_0px_#795653] flex items-center justify-center text-center">
                    <span
                      className="font-black leading-tight"
                      style={{ fontFamily: "'Cal Sans', sans-serif", color: '#F891BB', fontSize: '16px' }}
                    >
                      {spinPrice} xu cá / lượt
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message if any */}
              {errorMessage && (
                <div className="col-span-2 w-full mt-1 p-2 rounded-lg bg-rose-50 border-2 border-rose-400 text-rose-700 text-xs font-bold text-center animate-in fade-in">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          {/* Machine Bottom Feet (Retro industrial blocks) */}
          <div className="w-full flex justify-between px-8 -mt-1 z-0">
            <div className="w-14 h-4 rounded-b-md bg-[#795653]" />
            <div className="w-14 h-4 rounded-b-md bg-[#795653]" />
          </div>
        </div>

        {/* ================= VERTICAL CAPSULE SHOWCASE (RIGHT SIDE) ================= */}
        <div className="w-full max-w-[380px] md:w-56 lg:w-60 bg-[#FFF9F4] rounded-2xl border-2 border-[#795653] p-4 shadow-[4px_4px_0px_#795653] flex flex-col gap-3">
          <div className="flex items-center gap-1.5 border-b-2 border-[#795653]/15 pb-2">
            <span className="text-sm">🎏</span>
            <span
              className="text-xs font-black tracking-widest uppercase"
              style={{
                fontFamily: "'Cal Sans', sans-serif",
                color: '#e3508a',
              }}
            >
              CÁC LOẠI CAPSULE
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Capsule 1: Strawberry Milk */}
            <div className="p-2.5 rounded-xl bg-white border-2 border-[#795653] shadow-[2px_2px_0px_#795653] flex items-center gap-3">
              <FlatVectorCapsule type="strawberry_milk" baseColor="#F599C6" size={38} glyph="🐟" />
              <span
                className="text-xs font-black leading-tight"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#F891BB' }}
              >
                Strawberry Milk
              </span>
            </div>

            {/* Capsule 2: Fish Blue */}
            <div className="p-2.5 rounded-xl bg-white border-2 border-[#795653] shadow-[2px_2px_0px_#795653] flex items-center gap-3">
              <FlatVectorCapsule type="fish_blue" baseColor="#B0CDE6" size={38} glyph="🐾" />
              <span
                className="text-xs font-black leading-tight"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#76C0EC' }}
              >
                Fish Blue
              </span>
            </div>

            {/* Capsule 3: Butter Cream */}
            <div
              className="p-2.5 rounded-xl bg-white border-2 border-[#795653] shadow-[2px_2px_0px_#795653] flex items-center gap-3"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              <FlatVectorCapsule type="butter_cream" baseColor="#F7E49B" size={38} glyph="💖" />
              <span
                className="text-xs font-black leading-tight"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#c2a160' }}
              >
                Butter Cream
              </span>
            </div>

            {/* Capsule 4: Pearl Rainbow */}
            <div className="p-2.5 rounded-xl bg-white border-2 border-[#795653] shadow-[2px_2px_0px_#795653] flex items-center gap-3">
              <FlatVectorCapsule type="pearl_rainbow" baseColor="#B7B1F2" size={38} glyph="🐱" />
              <span
                className="text-xs font-black text-purple-700 leading-tight"
                style={{ fontFamily: "'Cal Sans', sans-serif" }}
              >
                Pearl Rainbow
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CELEBRATION REWARD POPUP MODAL ================= */}
      {isModalOpen && currentReward && currentVoucher && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleCloseModal}
          className="fixed inset-0 z-50 bg-[#795653]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* Modal Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-[#FFF9F4] border-[3.5px] border-[#795653] shadow-[8px_8px_0px_#795653] p-6 sm:p-7 flex flex-col items-center text-center overflow-hidden animate-in zoom-in-95 duration-300"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white text-[#795653] border-2 border-[#795653] shadow-[2px_2px_0px_#795653] flex items-center justify-center cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              title="Đóng (hoặc nhấn bên ngoài)"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Retro Ribbon Header */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-md bg-[#F7DDA0] border-2 border-[#795653] text-[#795653] text-xs font-black shadow-[2px_2px_0px_#795653] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>CHÚC MỪNG BÀ ĐÃ TRÚNG!</span>
            </div>

            {/* Split Capsule Graphic */}
            <div className="my-2 relative flex flex-col items-center justify-center">
              <OpenedRetroCapsuleGraphic
                type={dispensedCapsuleType}
                baseColor={dispensedBaseColor}
                glyph={dispensedGlyph}
                rewardCoins={currentReward.coins}
              />
            </div>

            {/* Reward Title */}
            <h3 className="text-xl font-black text-[#795653] mt-2 mb-1">
              {currentReward.label}
            </h3>
            <p className="text-xs text-[#795653]/75 mb-3 px-2">
              Bà vừa rước được quả capsule thần kỳ từ máy gacha <strong className="text-[#795653]">"mèo mê cá khô"</strong>!
            </p>

            {/* Voucher Card details */}
            <div className="w-full bg-white rounded-xl border-2 border-dashed border-[#795653] p-3 mb-4 flex flex-col items-center shadow-xs">
              <span className="text-[10px] font-black text-[#795653]/60 uppercase tracking-widest">
                MÃ VOUCHER ĐỔI XU
              </span>
              <span className="font-mono font-black text-sm text-[#0A5EB0] tracking-wider my-0.5">
                {currentVoucher.code}
              </span>
              <span className="text-xs font-black text-[#A6536A]">
                +{currentReward.coins} Xu Cá
              </span>
            </div>

            {/* Actions */}
            <div className="w-full space-y-2">
              <button
                type="button"
                disabled={isClaimingVoucher || claimedSuccess}
                onClick={handleClaimVoucherNow}
                className="w-full py-3 px-4 rounded-xl bg-[#F6A6B8] hover:bg-[#f391a6] text-[#795653] font-black text-xs tracking-wider uppercase shadow-[3px_3px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#795653] border-2 border-[#795653] transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {claimedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>ĐÃ NẠP +{currentReward.coins} XU VÀO VÍ!</span>
                  </>
                ) : isClaimingVoucher ? (
                  <span>ĐANG QUY ĐỔI...</span>
                ) : (
                  <>
                    <Gift className="w-4 h-4 text-[#795653]" />
                    <span>QUY ĐỔI NGAY VÀO VÍ CÁ</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCloseModal();
                  if (onOpenVouchersTab) onOpenVouchersTab();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#FFF9F4] text-[#795653] font-bold text-xs border-2 border-[#795653] shadow-[2px_2px_0px_#795653] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Xem trong Kho Voucher</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#795653]/60" />
              </button>
            </div>

            <p className="text-[10px] text-[#795653]/50 mt-3 font-semibold">
              Nhấn bất kỳ đâu bên ngoài để đóng lại
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// FLAT 2D VECTOR CAPSULE (RETRO POSTER STYLE)
// ==========================================
interface FlatVectorCapsuleProps {
  type?: GachaCapsuleType;
  baseColor?: string;
  size?: number;
  glyph: string;
}

const FlatVectorCapsule: React.FC<FlatVectorCapsuleProps> = ({
  type,
  baseColor,
  size = 48,
  glyph,
}) => {
  const getTheme = () => {
    // 9 Preset Pastel Themes matching user request:
    // B0CDE6, F599C6, C7D3C0, F7E49B, B7B1F2, E5D9F2, D2E0FB, C5B3D3, B1D3B9
    const PALETTE_THEMES: Record<
      string,
      { botFill: string; topFill: string; seamFill: string; textColor: string }
    > = {
      '#B0CDE6': {
        botFill: '#B0CDE6',
        topFill: '#F0F6FC',
        seamFill: '#8EAFD4',
        textColor: '#0A5EB0',
      },
      '#F599C6': {
        botFill: '#F599C6',
        topFill: '#FFF0F5',
        seamFill: '#DE7AA9',
        textColor: '#A62B68',
      },
      '#C7D3C0': {
        botFill: '#C7D3C0',
        topFill: '#F4F7F2',
        seamFill: '#A8BBA0',
        textColor: '#43613B',
      },
      '#F7E49B': {
        botFill: '#F7E49B',
        topFill: '#FFFDF4',
        seamFill: '#DEC468',
        textColor: '#8F6A08',
      },
      '#B7B1F2': {
        botFill: '#B7B1F2',
        topFill: '#F4F2FD',
        seamFill: '#968EE0',
        textColor: '#5446B3',
      },
      '#E5D9F2': {
        botFill: '#E5D9F2',
        topFill: '#FAF5FE',
        seamFill: '#C9B5E2',
        textColor: '#6D4496',
      },
      '#D2E0FB': {
        botFill: '#D2E0FB',
        topFill: '#F4F8FE',
        seamFill: '#AFC7F5',
        textColor: '#1C54A8',
      },
      '#C5B3D3': {
        botFill: '#C5B3D3',
        topFill: '#F8F4FA',
        seamFill: '#A993BA',
        textColor: '#5C3E73',
      },
      '#B1D3B9': {
        botFill: '#B1D3B9',
        topFill: '#F2F8F4',
        seamFill: '#8FBFA0',
        textColor: '#246337',
      },
    };

    const colorKey = (baseColor || '').toUpperCase();
    if (colorKey && PALETTE_THEMES[colorKey]) {
      return PALETTE_THEMES[colorKey];
    }

    if (baseColor) {
      return {
        botFill: baseColor,
        topFill: '#FFFFFF',
        seamFill: '#795653',
        textColor: '#795653',
      };
    }

    // Default fallback by capsule type
    switch (type) {
      case 'strawberry_milk':
        return PALETTE_THEMES['#F599C6'];
      case 'fish_blue':
        return PALETTE_THEMES['#B0CDE6'];
      case 'butter_cream':
        return PALETTE_THEMES['#F7E49B'];
      case 'pearl_rainbow':
      default:
        return PALETTE_THEMES['#B7B1F2'];
    }
  };

  const theme = getTheme();

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="w-full h-full overflow-visible"
      >
        {/* Flat Drop Shadow ellipse underneath */}
        <ellipse cx="50" cy="94" rx="34" ry="4.5" fill="#795653" opacity="0.18" />

        {/* Bottom Base Cup: Compact shallow cup (~30% ratio - tỉ lệ ít lại) */}
        <path
          d="M 15.1 65 A 38 38 0 0 0 84.9 65 Z"
          fill={theme.botFill}
          stroke="#795653"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />

        {/* Top Dome: Spacious translucent crystal dome (~70% ratio) */}
        <path
          d="M 15.1 65 A 38 38 0 1 1 84.9 65 Z"
          fill={theme.topFill}
          fillOpacity="0.88"
          stroke="#795653"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />

        {/* Inner Symbol: One of the 8 required cat/fish symbols in spacious clear dome */}
        <text
          x="50"
          y="39"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="24"
          fill={theme.textColor}
          fontWeight="bold"
        >
          {glyph}
        </text>

        {/* Seam Band / Collar Lip at the base rim (y = 63 to 67) */}
        <rect
          x="14"
          y="63"
          width="72"
          height="4"
          rx="2"
          fill={theme.seamFill}
          stroke="#795653"
          strokeWidth="2.5"
        />

        {/* Flat 2D Vector Gloss / Reflection (Clean white arcs on upper dome) */}
        <path
          d="M 23 30 A 28 28 0 0 1 48 16"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <circle cx="19" cy="39" r="2.2" fill="#FFFFFF" opacity="0.9" />

        {/* Subtle gloss highlight on colored base cup */}
        <path
          d="M 28 77 A 34 34 0 0 0 42 84"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>
  );
};

// ==========================================
// OPENED CAPSULE GRAPHIC IN RESULT POPUP
// ==========================================
interface OpenedRetroCapsuleGraphicProps {
  type: GachaCapsuleType;
  baseColor?: string;
  glyph: string;
  rewardCoins: number;
}

const OpenedRetroCapsuleGraphic: React.FC<OpenedRetroCapsuleGraphicProps> = ({
  type,
  baseColor,
  glyph,
  rewardCoins,
}) => {
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      {/* Top half split upward with compact 30% base proportion */}
      <div className="absolute top-1 left-3 transform -translate-y-3 -rotate-15 transition-transform z-10">
        <FlatVectorCapsule type={type} baseColor={baseColor} size={62} glyph={glyph} />
      </div>

      {/* Center Golden Fish Coin burst */}
      <div className="relative z-20 w-16 h-16 rounded-full bg-[#F7DDA0] border-[3.5px] border-[#795653] shadow-[3px_3px_0px_#795653] flex flex-col items-center justify-center animate-bounce">
        <span className="text-sm">𓆜</span>
        <span className="text-xs font-black text-[#795653] -mt-0.5">+{rewardCoins}</span>
      </div>

      {/* Sparkles / glyph badges */}
      <span className="absolute -top-2 -left-2 text-sm text-[#F7DDA0]">✨</span>
      <span className="absolute -bottom-1 -right-2 text-base text-[#F6A6B8]">💖</span>
      <span className="absolute top-2 -right-3 text-sm text-[#A9C5F2]">✦</span>
      <span className="absolute -bottom-2 -left-1 text-sm text-[#795653]">🐾</span>
    </div>
  );
};
