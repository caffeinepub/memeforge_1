import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import {
  Copy,
  Download,
  ImageIcon,
  Loader2,
  Plus,
  Smile,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateMeme, useGetCallerProfile } from "../hooks/useQueries";

// ---- Types ----
interface TextLayer {
  id: string;
  text: string;
  font: string;
  size: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  x: number;
  y: number;
  rotation: number;
  alignment: CanvasTextAlign;
  opacity: number;
}

interface StickerLayer {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

interface Filters {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  invert: boolean;
}

// ---- Constants ----
const CANVAS_W = 800;
const CANVAS_H = 600;

const FONTS = [
  "Impact",
  "Bangers",
  "Oswald",
  "Lobster",
  "Comic Sans MS",
  "Arial",
  "Georgia",
  "Verdana",
  "Courier New",
  "Times New Roman",
  "Trebuchet MS",
  "Palatino",
];

const EMOJIS = [
  "😂",
  "🔥",
  "💯",
  "👆",
  "😤",
  "🤔",
  "💀",
  "😭",
  "🎉",
  "👀",
  "😎",
  "🤣",
  "💪",
  "🙏",
  "✨",
  "👌",
];

interface MemeTemplate {
  name: string;
  bgColor: string;
  topText: string;
  bottomText: string;
  accentColor: string;
}

const TEMPLATES: MemeTemplate[] = [
  {
    name: "Drake",
    bgColor: "#1a1a2e",
    topText: "Nah I'm good",
    bottomText: "This meme format",
    accentColor: "#e94560",
  },
  {
    name: "Distracted BF",
    bgColor: "#16213e",
    topText: "Me",
    bottomText: "New shiny thing",
    accentColor: "#0f3460",
  },
  {
    name: "This Is Fine",
    bgColor: "#8b4513",
    topText: "Everything is fine",
    bottomText: "🔥🔥🔥",
    accentColor: "#ff6b35",
  },
  {
    name: "Two Buttons",
    bgColor: "#1e1e2e",
    topText: "Button A",
    bottomText: "Button B",
    accentColor: "#a855f7",
  },
  {
    name: "Expanding Brain",
    bgColor: "#0d1117",
    topText: "Small brain idea",
    bottomText: "GALAXY BRAIN IDEA",
    accentColor: "#22d3ee",
  },
  {
    name: "Change My Mind",
    bgColor: "#1c1c1c",
    topText: "Memes are art.",
    bottomText: "Change my mind.",
    accentColor: "#f59e0b",
  },
  {
    name: "Stonks",
    bgColor: "#065f46",
    topText: "Shares go up",
    bottomText: "STONKS 📈",
    accentColor: "#10b981",
  },
  {
    name: "Doge",
    bgColor: "#92400e",
    topText: "wow such meme",
    bottomText: "very funny",
    accentColor: "#fbbf24",
  },
];

function generateId() {
  return Math.random().toString(36).slice(2);
}

function drawTemplateToCanvas(
  ctx: CanvasRenderingContext2D,
  template: MemeTemplate,
) {
  ctx.fillStyle = template.bgColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
  grad.addColorStop(0, `${template.accentColor}33`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.font = "bold 80px Impact, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(template.name.toUpperCase(), CANVAS_W / 2, CANVAS_H / 2 + 30);

  ctx.strokeStyle = `${template.accentColor}66`;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);
}

export default function CreatePage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: profile } = useGetCallerProfile();
  const createMeme = useCreateMeme();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(
    null,
  );
  const [textLayers, setTextLayers] = useState<TextLayer[]>([
    {
      id: generateId(),
      text: "TOP TEXT",
      font: "Impact",
      size: 48,
      color: "#ffffff",
      strokeColor: "#000000",
      strokeWidth: 2,
      x: CANVAS_W / 2,
      y: 60,
      rotation: 0,
      alignment: "center",
      opacity: 100,
    },
    {
      id: generateId(),
      text: "BOTTOM TEXT",
      font: "Impact",
      size: 48,
      color: "#ffffff",
      strokeColor: "#000000",
      strokeWidth: 2,
      x: CANVAS_W / 2,
      y: CANVAS_H - 20,
      rotation: 0,
      alignment: "center",
      opacity: 100,
    },
  ]);
  const [stickerLayers, setStickerLayers] = useState<StickerLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    () => textLayers[0]?.id ?? null,
  );
  const [filters, setFilters] = useState<Filters>({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    invert: false,
  });
  const [memeTitle, setMemeTitle] = useState("");
  const [memeTags, setMemeTags] = useState("");
  const [publishProgress, setPublishProgress] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  const dragRef = useRef<{
    id: string;
    kind: "text" | "sticker";
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // ---- Canvas Rendering ----
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const filterParts = [
      `brightness(${filters.brightness}%)`,
      `contrast(${filters.contrast}%)`,
      `saturate(${filters.saturate}%)`,
      `grayscale(${filters.grayscale}%)`,
    ];
    if (filters.invert) filterParts.push("invert(100%)");
    canvas.style.filter = filterParts.join(" ");

    if (baseImage) {
      const aspectRatio = baseImage.naturalWidth / baseImage.naturalHeight;
      const canvasAspect = CANVAS_W / CANVAS_H;
      let dx = 0;
      let dy = 0;
      let dw = CANVAS_W;
      let dh = CANVAS_H;
      if (aspectRatio > canvasAspect) {
        dh = CANVAS_H;
        dw = dh * aspectRatio;
        dx = (CANVAS_W - dw) / 2;
      } else {
        dw = CANVAS_W;
        dh = dw / aspectRatio;
        dy = (CANVAS_H - dh) / 2;
      }
      ctx.drawImage(baseImage, dx, dy, dw, dh);
    } else if (selectedTemplate) {
      drawTemplateToCanvas(ctx, selectedTemplate);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    for (const tl of textLayers) {
      ctx.save();
      ctx.globalAlpha = tl.opacity / 100;
      ctx.translate(tl.x, tl.y);
      ctx.rotate((tl.rotation * Math.PI) / 180);
      ctx.font = `${tl.size}px "${tl.font}", Impact, sans-serif`;
      ctx.textAlign = tl.alignment;
      ctx.textBaseline = "middle";

      if (tl.strokeWidth > 0) {
        ctx.strokeStyle = tl.strokeColor;
        ctx.lineWidth = tl.strokeWidth * 2;
        ctx.lineJoin = "round";
        ctx.strokeText(tl.text, 0, 0);
      }
      ctx.fillStyle = tl.color;
      ctx.fillText(tl.text, 0, 0);
      ctx.globalAlpha = 1;

      if (tl.id === selectedLayerId) {
        ctx.globalAlpha = 1;
        const metrics = ctx.measureText(tl.text);
        const tw = metrics.width;
        const th = tl.size;
        const pad = 4;
        const ox =
          tl.alignment === "center"
            ? -tw / 2
            : tl.alignment === "right"
              ? -tw
              : 0;
        ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(ox - pad, -th / 2 - pad, tw + pad * 2, th + pad * 2);
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    for (const sl of stickerLayers) {
      ctx.save();
      ctx.font = `${sl.size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sl.emoji, sl.x, sl.y);

      if (sl.id === selectedLayerId) {
        ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          sl.x - sl.size / 2 - 4,
          sl.y - sl.size / 2 - 4,
          sl.size + 8,
          sl.size + 8,
        );
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }, [
    baseImage,
    bgColor,
    selectedTemplate,
    textLayers,
    stickerLayers,
    selectedLayerId,
    filters,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const hitTestLayers = (
    px: number,
    py: number,
  ): { id: string; kind: "text" | "sticker" } | null => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    for (let i = stickerLayers.length - 1; i >= 0; i--) {
      const sl = stickerLayers[i];
      const hw = sl.size / 2 + 8;
      if (Math.abs(px - sl.x) < hw && Math.abs(py - sl.y) < hw) {
        return { id: sl.id, kind: "sticker" };
      }
    }
    for (let i = textLayers.length - 1; i >= 0; i--) {
      const tl = textLayers[i];
      ctx.font = `${tl.size}px "${tl.font}"`;
      const metrics = ctx.measureText(tl.text);
      const tw = metrics.width;
      const th = tl.size;
      const ox =
        tl.alignment === "center" ? tw / 2 : tl.alignment === "right" ? tw : 0;
      const lx = tl.x - ox;
      const ly = tl.y - th / 2;
      if (
        px >= lx - 8 &&
        px <= lx + tw + 8 &&
        py >= ly - 8 &&
        py <= ly + th + 8
      ) {
        return { id: tl.id, kind: "text" };
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasPos(e);
    const hit = hitTestLayers(x, y);
    if (hit) {
      setSelectedLayerId(hit.id);
      if (hit.kind === "text") {
        const tl = textLayers.find((t) => t.id === hit.id)!;
        dragRef.current = {
          id: hit.id,
          kind: "text",
          offsetX: x - tl.x,
          offsetY: y - tl.y,
        };
      } else {
        const sl = stickerLayers.find((s) => s.id === hit.id)!;
        dragRef.current = {
          id: hit.id,
          kind: "sticker",
          offsetX: x - sl.x,
          offsetY: y - sl.y,
        };
      }
    } else {
      setSelectedLayerId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const { x, y } = getCanvasPos(e);
    const { id, kind, offsetX, offsetY } = dragRef.current;
    if (kind === "text") {
      setTextLayers((prev) =>
        prev.map((tl) =>
          tl.id === id ? { ...tl, x: x - offsetX, y: y - offsetY } : tl,
        ),
      );
    } else {
      setStickerLayers((prev) =>
        prev.map((sl) =>
          sl.id === id ? { ...sl, x: x - offsetX, y: y - offsetY } : sl,
        ),
      );
    }
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const addTextLayer = () => {
    const id = generateId();
    const newLayer: TextLayer = {
      id,
      text: "NEW TEXT",
      font: "Impact",
      size: 40,
      color: "#ffffff",
      strokeColor: "#000000",
      strokeWidth: 2,
      x: CANVAS_W / 2,
      y: CANVAS_H / 2,
      rotation: 0,
      alignment: "center",
      opacity: 100,
    };
    setTextLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(id);
  };

  const duplicateTextLayer = () => {
    if (!selectedLayerId) return;
    const original = textLayers.find((t) => t.id === selectedLayerId);
    if (!original) return;
    const id = generateId();
    const duplicate: TextLayer = {
      ...original,
      id,
      x: original.x + 20,
      y: original.y + 20,
    };
    setTextLayers((prev) => [...prev, duplicate]);
    setSelectedLayerId(id);
  };

  const addSticker = (emoji: string) => {
    const id = generateId();
    setStickerLayers((prev) => [
      ...prev,
      { id, emoji, x: CANVAS_W / 2, y: CANVAS_H / 2, size: 60 },
    ]);
    setSelectedLayerId(id);
  };

  const removeSelectedLayer = () => {
    if (!selectedLayerId) return;
    setTextLayers((prev) => prev.filter((t) => t.id !== selectedLayerId));
    setStickerLayers((prev) => prev.filter((s) => s.id !== selectedLayerId));
    setSelectedLayerId(null);
  };

  const clearAll = () => {
    setTextLayers([]);
    setStickerLayers([]);
    setSelectedLayerId(null);
    setBaseImage(null);
    setSelectedTemplate(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setBaseImage(img);
      setSelectedTemplate(null);
    };
    img.src = url;
  };

  const selectTemplate = (tpl: MemeTemplate) => {
    setSelectedTemplate(tpl);
    setBaseImage(null);
    setTextLayers([
      {
        id: generateId(),
        text: tpl.topText,
        font: "Impact",
        size: 48,
        color: "#ffffff",
        strokeColor: "#000000",
        strokeWidth: 2,
        x: CANVAS_W / 2,
        y: 60,
        rotation: 0,
        alignment: "center",
        opacity: 100,
      },
      {
        id: generateId(),
        text: tpl.bottomText,
        font: "Impact",
        size: 48,
        color: "#ffffff",
        strokeColor: "#000000",
        strokeWidth: 2,
        x: CANVAS_W / 2,
        y: CANVAS_H - 30,
        rotation: 0,
        alignment: "center",
        opacity: 100,
      },
    ]);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "meme.png";
    a.click();
    toast.success("Downloading meme!");
  };

  const handlePublish = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to publish memes");
      navigate({ to: "/login" });
      return;
    }
    if (!memeTitle.trim()) {
      toast.error("Please add a title");
      return;
    }

    setIsPublishing(true);
    setPublishProgress(0);

    try {
      const canvas = canvasRef.current!;
      const dataUrl = canvas.toDataURL("image/png");
      const res = await fetch(dataUrl);
      const arrayBuffer = await res.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8).withUploadProgress((pct) =>
        setPublishProgress(pct),
      );

      const tags = memeTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await createMeme.mutateAsync({
        title: memeTitle,
        blob,
        tags,
        authorName:
          profile?.username ??
          `${identity?.getPrincipal().toString().slice(0, 8) ?? ""}...`,
      });

      toast.success("Meme published! 🎉");
      navigate({ to: "/" });
    } catch (err) {
      toast.error("Failed to publish meme");
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedText = textLayers.find((t) => t.id === selectedLayerId);
  const selectedSticker = stickerLayers.find((s) => s.id === selectedLayerId);
  const isTextSelected = !!selectedText;

  const updateText = (
    field: keyof TextLayer,
    value: string | number | CanvasTextAlign,
  ) => {
    if (!selectedLayerId) return;
    setTextLayers((prev) =>
      prev.map((tl) =>
        tl.id === selectedLayerId ? { ...tl, [field]: value } : tl,
      ),
    );
  };

  const updateSticker = (field: keyof StickerLayer, value: number) => {
    if (!selectedLayerId) return;
    setStickerLayers((prev) =>
      prev.map((sl) =>
        sl.id === selectedLayerId ? { ...sl, [field]: value } : sl,
      ),
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" data-ocid="create.section">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Meme Forge <span className="gradient-brand">Editor</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Create your masterpiece
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5"
            data-ocid="create.secondary_button"
          >
            <Download className="h-4 w-4" /> Export PNG
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing || createMeme.isPending}
            className="bg-gradient-brand text-white gap-1.5"
            data-ocid="create.primary_button"
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Publishing{" "}
                {publishProgress}%
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Publish
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-5">
        {/* ---- LEFT PANEL ---- */}
        <div className="space-y-4">
          <Tabs defaultValue="templates">
            <TabsList className="w-full">
              <TabsTrigger
                value="templates"
                className="flex-1 text-xs"
                data-ocid="create.tab"
              >
                Templates
              </TabsTrigger>
              <TabsTrigger
                value="stickers"
                className="flex-1 text-xs"
                data-ocid="create.tab"
              >
                Stickers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full gap-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 text-sm"
                  onClick={() => fileInputRef.current?.click()}
                  data-ocid="create.upload_button"
                >
                  <ImageIcon className="h-4 w-4" /> Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {!baseImage && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-20 shrink-0">BG Color</Label>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => {
                        setBgColor(e.target.value);
                        setSelectedTemplate(null);
                      }}
                      className="h-7 w-12 rounded cursor-pointer border border-border bg-transparent"
                    />
                  </div>
                )}

                <ScrollArea className="h-[360px]">
                  <div className="grid grid-cols-2 gap-2 pr-2">
                    {TEMPLATES.map((tpl) => (
                      <button
                        type="button"
                        key={tpl.name}
                        onClick={() => selectTemplate(tpl)}
                        className={`rounded-lg overflow-hidden border-2 transition-all text-left ${
                          selectedTemplate?.name === tpl.name
                            ? "border-primary scale-95"
                            : "border-border hover:border-primary/50"
                        }`}
                        data-ocid="create.button"
                      >
                        <div
                          className="h-16 flex items-center justify-center text-xs font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${tpl.bgColor}, ${tpl.accentColor}33)`,
                          }}
                        >
                          {tpl.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="stickers">
              <div className="grid grid-cols-4 gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => addSticker(emoji)}
                    className="h-12 text-2xl rounded-lg border border-border hover:border-primary/50 hover:bg-muted transition-colors flex items-center justify-center"
                    data-ocid="create.button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ---- CANVAS ---- */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative rounded-xl overflow-hidden border border-border shadow-lg"
            style={{ width: "100%", maxWidth: `${CANVAS_W}px` }}
            data-ocid="create.canvas_target"
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                width: "100%",
                cursor: dragRef.current ? "grabbing" : "default",
                userSelect: "none",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          <div className="w-full max-w-[800px] rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="font-semibold text-sm">Publish Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Title *</Label>
                <Input
                  value={memeTitle}
                  onChange={(e) => setMemeTitle(e.target.value)}
                  placeholder="Give your meme a name..."
                  className="h-8 text-sm"
                  data-ocid="create.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tags (comma separated)</Label>
                <Input
                  value={memeTags}
                  onChange={(e) => setMemeTags(e.target.value)}
                  placeholder="funny, cats, relatable"
                  className="h-8 text-sm"
                  data-ocid="create.input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ---- RIGHT PANEL ---- */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Type className="h-4 w-4" /> Text Layers
              </h3>
              {selectedLayerId && isTextSelected && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:bg-muted"
                    onClick={duplicateTextLayer}
                    title="Duplicate layer"
                    data-ocid="create.secondary_button"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    onClick={removeSelectedLayer}
                    data-ocid="create.delete_button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {selectedLayerId && !isTextSelected && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                  onClick={removeSelectedLayer}
                  data-ocid="create.delete_button"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="space-y-1 mb-2">
              {textLayers.map((tl) => (
                <button
                  type="button"
                  key={tl.id}
                  onClick={() => setSelectedLayerId(tl.id)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors truncate ${
                    tl.id === selectedLayerId
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                  style={{ fontFamily: tl.font }}
                  data-ocid="create.button"
                >
                  <Type
                    className="inline h-3 w-3 mr-1"
                    style={{ fontFamily: "inherit" }}
                  />
                  {tl.text || "(empty)"}
                </button>
              ))}
              {stickerLayers.map((sl) => (
                <button
                  type="button"
                  key={sl.id}
                  onClick={() => setSelectedLayerId(sl.id)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                    sl.id === selectedLayerId
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                  data-ocid="create.button"
                >
                  <Smile className="inline h-3 w-3 mr-1" />
                  {sl.emoji}
                </button>
              ))}
            </div>

            {/* Add Text Layer button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 text-xs"
              onClick={addTextLayer}
              data-ocid="create.button"
            >
              <Plus className="h-3.5 w-3.5" /> Add Text Layer
            </Button>

            {selectedText && (
              <div className="space-y-2 pt-3 mt-3 border-t border-border">
                <div>
                  <Label className="text-xs">Text</Label>
                  <Input
                    value={selectedText.text}
                    onChange={(e) => updateText("text", e.target.value)}
                    className="h-7 text-sm mt-0.5"
                    data-ocid="create.input"
                  />
                </div>

                <div>
                  <Label className="text-xs">Font</Label>
                  <Select
                    value={selectedText.font}
                    onValueChange={(v) => updateText("font", v)}
                  >
                    <SelectTrigger
                      className="h-7 text-xs mt-0.5"
                      data-ocid="create.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONTS.map((f) => (
                        <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Color</Label>
                    <input
                      type="color"
                      value={selectedText.color}
                      onChange={(e) => updateText("color", e.target.value)}
                      className="h-7 w-full rounded border border-border bg-transparent cursor-pointer mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Stroke</Label>
                    <input
                      type="color"
                      value={selectedText.strokeColor}
                      onChange={(e) =>
                        updateText("strokeColor", e.target.value)
                      }
                      className="h-7 w-full rounded border border-border bg-transparent cursor-pointer mt-0.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Size: {selectedText.size}px</Label>
                  <Slider
                    value={[selectedText.size]}
                    onValueChange={([v]) => updateText("size", v)}
                    min={12}
                    max={120}
                    step={1}
                    className="mt-1"
                    data-ocid="create.button"
                  />
                </div>

                <div>
                  <Label className="text-xs">
                    Stroke Width: {selectedText.strokeWidth}
                  </Label>
                  <Slider
                    value={[selectedText.strokeWidth]}
                    onValueChange={([v]) => updateText("strokeWidth", v)}
                    min={0}
                    max={10}
                    step={0.5}
                    className="mt-1"
                    data-ocid="create.button"
                  />
                </div>

                <div>
                  <Label className="text-xs">
                    Opacity: {selectedText.opacity}%
                  </Label>
                  <Slider
                    value={[selectedText.opacity]}
                    onValueChange={([v]) => updateText("opacity", v)}
                    min={0}
                    max={100}
                    step={1}
                    className="mt-1"
                    data-ocid="create.button"
                  />
                </div>

                <div>
                  <Label className="text-xs">
                    Rotation: {selectedText.rotation}&deg;
                  </Label>
                  <Slider
                    value={[selectedText.rotation]}
                    onValueChange={([v]) => updateText("rotation", v)}
                    min={-180}
                    max={180}
                    step={1}
                    className="mt-1"
                    data-ocid="create.button"
                  />
                </div>

                {/* X / Y position inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">X Position</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedText.x)}
                      onChange={(e) => updateText("x", Number(e.target.value))}
                      className="h-7 text-xs mt-0.5"
                      data-ocid="create.input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Y Position</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedText.y)}
                      onChange={(e) => updateText("y", Number(e.target.value))}
                      className="h-7 text-xs mt-0.5"
                      data-ocid="create.input"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Alignment</Label>
                  <div className="flex gap-1 mt-0.5">
                    {(["left", "center", "right"] as CanvasTextAlign[]).map(
                      (a) => (
                        <button
                          type="button"
                          key={a}
                          onClick={() => updateText("alignment", a)}
                          className={`flex-1 text-xs py-1 rounded border transition-colors ${
                            selectedText.alignment === a
                              ? "bg-primary/20 border-primary text-primary"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                          data-ocid="create.toggle"
                        >
                          {a}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedSticker && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedSticker.emoji}
                </p>
                <div>
                  <Label className="text-xs">
                    Size: {selectedSticker.size}px
                  </Label>
                  <Slider
                    value={[selectedSticker.size]}
                    onValueChange={([v]) => updateSticker("size", v)}
                    min={20}
                    max={200}
                    step={1}
                    className="mt-1"
                    data-ocid="create.button"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-3 space-y-2">
            <h3 className="text-sm font-semibold">Image Filters</h3>

            {[
              {
                key: "brightness" as const,
                label: "Brightness",
                min: 0,
                max: 200,
              },
              { key: "contrast" as const, label: "Contrast", min: 0, max: 200 },
              {
                key: "saturate" as const,
                label: "Saturation",
                min: 0,
                max: 200,
              },
              {
                key: "grayscale" as const,
                label: "Grayscale",
                min: 0,
                max: 100,
              },
            ].map(({ key, label, min, max }) => (
              <div key={key}>
                <Label className="text-xs">
                  {label}:{" "}
                  {typeof filters[key] === "number"
                    ? (filters[key] as number)
                    : ""}
                </Label>
                <Slider
                  value={[filters[key] as number]}
                  onValueChange={([v]) =>
                    setFilters((prev) => ({ ...prev, [key]: v }))
                  }
                  min={min}
                  max={max}
                  step={1}
                  className="mt-1"
                  data-ocid="create.button"
                />
              </div>
            ))}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="invert"
                checked={filters.invert}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, invert: e.target.checked }))
                }
                className="accent-primary"
                data-ocid="create.checkbox"
              />
              <Label htmlFor="invert" className="text-xs cursor-pointer">
                Invert Colors
              </Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() =>
                setFilters({
                  brightness: 100,
                  contrast: 100,
                  saturate: 100,
                  grayscale: 0,
                  invert: false,
                })
              }
              data-ocid="create.button"
            >
              Reset Filters
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={clearAll}
              data-ocid="create.delete_button"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
