import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Skeleton } from 'primeng/skeleton';
import { VideoFacade } from '../video-facade';
import { GetVideoDto } from '../../../../core/api/clients';

@Component({
  selector: 'app-get-all-videos',
  imports: [Skeleton],
  templateUrl: './get-all-videos.html',
  styleUrl: './get-all-videos.css',
})
export class GetAllVideos implements OnInit, OnDestroy {
  private active = inject(ActivatedRoute);
  private router = inject(Router);
  private videoFacade = inject(VideoFacade);
  private sanitizer = inject(DomSanitizer);
  private location = inject(Location);

  private params = toSignal(this.active.paramMap, {
    initialValue: this.active.snapshot.paramMap,
  });

  private lastLoadedId = signal<{ id: number; type: 'curriculum' | 'section' } | null>(null);

  videos = this.videoFacade.videos;
  isLoading = this.videoFacade.isLoading;

  selectedVideo = signal<GetVideoDto | null>(null);
  isPlaying = signal<boolean>(false);
  currentSpeed = signal<number>(1);
  isFullscreen = signal<boolean>(false);

  private routeId = computed(() => Number(this.params().get('curriculumId')));
  
  isSection = computed(() => {
    return this.router.url.includes('/sections/');
  });

  safeUrl = computed(() => {
    const video = this.selectedVideo();
    if (!video || !video.url) return null;
    const embedUrl = this.getEmbedUrl(video.url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  });

  isYouTube = computed(() => {
    const video = this.selectedVideo();
    if (!video || !video.url) return false;
    return video.url.includes('youtube.com') || video.url.includes('youtu.be');
  });

  constructor() {
    effect(() => {
      const id = this.routeId();
      const isSec = this.isSection();
      const type = isSec ? 'section' : 'curriculum';

      if (id > 0) {
        if (this.lastLoadedId()?.id === id && this.lastLoadedId()?.type === type) return;
        this.lastLoadedId.set({ id, type });
        if (isSec) {
          this.videoFacade.loadVideosForSection(id);
        } else {
          this.videoFacade.loadVideosForCurriculum(id);
        }
      }
    });

    effect(() => {
      const vids = this.videos();
      if (vids.length > 0) {
        // Automatically select the first video if none is selected or current is not in list
        const current = this.selectedVideo();
        if (!current || !vids.some(v => v.id === current.id)) {
          this.selectedVideo.set(vids[0]);
        }
      } else {
        this.selectedVideo.set(null);
      }
    });
  }

  ngOnInit() {
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
  }

  ngOnDestroy() {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
  }

  private onFullscreenChange = () => {
    this.isFullscreen.set(!!document.fullscreenElement);
  };

  goBack() {
    this.location.back();
  }

  selectVideo(video: GetVideoDto) {
    this.selectedVideo.set(video);
    this.isPlaying.set(false);
    this.currentSpeed.set(1);
  }

  playVideo() {
    if (this.isYouTube()) {
      this.sendPlayerCommand('playVideo');
      this.isPlaying.set(true);
    }
  }

  pauseVideo() {
    if (this.isYouTube()) {
      this.sendPlayerCommand('pauseVideo');
      this.isPlaying.set(false);
    }
  }

  setSpeed(speed: number) {
    if (this.isYouTube()) {
      this.sendPlayerCommand('setPlaybackRate', [speed]);
      this.currentSpeed.set(speed);
    }
  }

  toggleFullscreen() {
    const playerContainer = document.getElementById('player-container');
    if (!playerContainer) return;

    if (!document.fullscreenElement) {
      playerContainer.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen mode:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  private sendPlayerCommand(func: string, args: any[] = []) {
    const iframe = document.getElementById('video-player-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  }

  private getEmbedUrl(url?: string): string {
    if (!url) return '';

    // Check if it's YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
      } else if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0] || '';
      } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1]?.split(/[?#]/)[0] || '';
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0` : url;
    }

    // Check if it's Google Drive
    if (url.includes('drive.google.com')) {
      let fileId = '';
      if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1]?.split('/')[0] || '';
      } else if (url.includes('?id=')) {
        fileId = url.split('?id=')[1]?.split('&')[0] || '';
      } else if (url.includes('&id=')) {
        fileId = url.split('&id=')[1]?.split('&')[0] || '';
      }
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
    }

    return url;
  }
}

