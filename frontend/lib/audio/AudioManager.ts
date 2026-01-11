class AudioManager {
	private sounds: Record<string, HTMLAudioElement> = {};
	private music: HTMLAudioElement | null = null;
	private isMuted: boolean = false;

	constructor() {
		if (typeof window !== "undefined") {
			this.load("fail", "/sounds/fail.wav");
			this.load("finish", "/sounds/finish.wav");
			this.load("hit", "/sounds/hit.wav");
			this.load("jump", "/sounds/jump.wav");
			this.load("score", "/sounds/score.wav");
			this.load("select_game", "/sounds/select-game.wav");
		}
	}

	private load(key: string, path: string) {
		const audio = new Audio(path);
		this.sounds[key] = audio;
	}

	play(key: string, volume: number = 0.5) {
		if (this.isMuted || !this.sounds[key]) return;

		try {
			const sound = this.sounds[key].cloneNode() as HTMLAudioElement;
			sound.volume = volume;
			sound
				.play()
				.catch((e) =>
					console.error("Ses çalma hatası (Etkileşim gerekebilir):", e)
				);
		} catch (e) {
			console.error("Audio error", e);
		}
	}

	playMusic(key: string, volume: number = 0.3) {
		if (!this.sounds[key]) return;

		if (this.music) {
			this.music.pause();
			this.music.currentTime = 0;
		}

		this.music = this.sounds[key];
		this.music.volume = volume;
		this.music.loop = true;

		this.music
			.play()
			.catch((e) =>
				console.log(
					"Müzik otomatik başlatılamadı, kullanıcı etkileşimi bekleniyor.",
					e
				)
			);
	}

	stopMusic() {
		if (this.music) this.music.pause();
	}

	toggleMute() {
		this.isMuted = !this.isMuted;
		if (this.isMuted && this.music) this.music.pause();
		if (!this.isMuted && this.music) this.music.play();
		return this.isMuted;
	}
}

export const audioManager = new AudioManager();
