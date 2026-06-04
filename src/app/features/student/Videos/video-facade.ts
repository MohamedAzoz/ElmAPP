import { Injectable, signal, inject } from '@angular/core';
import { GetVideoDto, VideoPublicClient } from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class VideoFacade {
  videos = signal<GetVideoDto[]>([]);
  isLoading = signal<boolean>(false);

  private videoPublicClient = inject(VideoPublicClient);

  loadVideosForSection(sectionId: number) {
    this.isLoading.set(true);
    return this.videoPublicClient.getAllVideosForSection(sectionId).subscribe({
      next: (res) => {
        this.videos.set(res.data || []);
        this.isLoading.set(false);
      },
      error: (e) => {
        console.error('Error fetching videos for section:', e);
        this.videos.set([]);
        this.isLoading.set(false);
      },
    });
  }

  loadVideosForCurriculum(curriculumId: number) {
    this.isLoading.set(true);
    return this.videoPublicClient.getAllVideosForCurriculum(curriculumId).subscribe({
      next: (res) => {
        this.videos.set(res.data || []);
        this.isLoading.set(false);
      },
      error: (e) => {
        console.error('Error fetching videos for curriculum:', e);
        this.videos.set([]);
        this.isLoading.set(false);
      },
    });
  }
}

