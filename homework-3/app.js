document.addEventListener("DOMContentLoaded", () => {
    
    const albumGrid = document.getElementById('album-grid-row');
    const albumModalElement = document.getElementById('exampleModal');
    const albumModal = new bootstrap.Modal(albumModalElement);
    const modalTitle = document.getElementById('exampleModalLabel');
    const modalBody = albumModalElement.querySelector('.modal-body');
    const modalPlayButton = document.getElementById('modal-play-spotify');
    const searchInput = document.getElementById('search-input');
    const sortDropdownButton = document.getElementById('sort-dropdown-button');
    const sortOptionsContainer = document.querySelector('.dropdown-menu');
    const backToTopButton = document.getElementById('back-to-top');

    let libraryData = [];
    let currentSortMode = 'default';
    
    async function loadLibrary() {
        try {
            const response = await fetch('library.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            libraryData = await response.json();
            handleSearch();

        } catch (error) {
            console.error("Error loading library data:", error);
            albumGrid.innerHTML = `<div class="col"><p class="text-danger">Failed to load music library.</p></div>`;
        }
    }

    function displayAlbums(albums) {
        albumGrid.innerHTML = ''; 

        albums.forEach(album => {
            const cardHTML = `
                <div class="col-xl-2 col-md-3 col-sm-6 col-12 mb-4">
                    <div class="card h-100 d-flex flex-column">
                        <div class="card-img-top-wrapper">
                            <img src="assets/img/${album.thumbnail}" class="card-img-top" alt="${album.album} Album Cover">
                        </div>
                        
                        <div class="card-body">
                            <h5 class="card-title">${album.artist}</h5>
                            <p class="card-text">${album.album}</p>
                        </div>

                        <div class="card-footer mt-auto">
                            <button type="button" 
                                    class="btn btn-primary w-100 btn-tracklist" 
                                    data-album-id="${album.id}">
                                View Tracklist
                            </button>
                        </div>
                    </div>
                </div>
            `;
            albumGrid.innerHTML += cardHTML;
        });
    }

    function parseDuration(timeString) {
        const parts = timeString.split(':').map(Number);
        return parts[0] * 60 + parts[1];
    }

    function formatDuration(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.round(totalSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function calculateTrackStats(tracklist) {
        let totalDurationInSeconds = 0;
        let shortestTrackSeconds = Infinity;
        let longestTrackSeconds = 0;
        let shortestTrackTitle = '';
        let longestTrackTitle = '';

        tracklist.forEach(track => {
            const trackSeconds = parseDuration(track.trackLength);
            totalDurationInSeconds += trackSeconds;

            if (trackSeconds < shortestTrackSeconds) {
                shortestTrackSeconds = trackSeconds;
                shortestTrackTitle = track.title;
            }
            if (trackSeconds > longestTrackSeconds) {
                longestTrackSeconds = trackSeconds;
                longestTrackTitle = track.title;
            }
        });

        const totalTracks = tracklist.length;
        const averageSeconds = totalDurationInSeconds / totalTracks;

        return {
            totalTracks: totalTracks,
            totalDuration: formatDuration(totalDurationInSeconds),
            averageLength: formatDuration(averageSeconds),
            shortestTrack: {
                title: shortestTrackTitle,
                length: formatDuration(shortestTrackSeconds)
            },
            longestTrack: {
                title: longestTrackTitle,
                length: formatDuration(longestTrackSeconds)
            }
        };
    }

    function populateModal(album) {
        modalTitle.textContent = `${album.artist} - ${album.album}`;
        
        const stats = calculateTrackStats(album.tracklist);

        const statsHTML = `
            <div classclass="mb-4">
                <h5 class="border-bottom pb-2 mb-3">Album Statistics</h5>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Total Tracks: <strong>${stats.totalTracks}</strong>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Total Duration: <strong>${stats.totalDuration}</strong>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Average Track: <strong>${stats.averageLength}</strong>
                    </li>
                    <li class="list-group-item">
                        Shortest: <strong>${stats.shortestTrack.title}</strong> (${stats.shortestTrack.length})
                    </li>
                    <li class="list-group-item">
                        Longest: <strong>${stats.longestTrack.title}</strong> (${stats.longestTrack.length})
                    </li>
                </ul>
            </div>
            <h5 class="border-bottom pb-2 mb-3 mt-4">Tracklist</h5>
        `;

        const tracklistHTML = album.tracklist.map(track => {
            return `
                <tr>
                    <td class="text-muted">${track.number}</td>
                    <td>
                        <a href="${track.url}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="link-body-emphasis text-decoration-none">
                            ${track.title}
                        </a>
                    </td>
                    <td class="text-end">${track.trackLength}</td>
                </tr>
            `;
        }).join(''); 

        modalBody.innerHTML = `
            ${statsHTML}
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th scope="col" style="width: 1%;">#</th>
                        <th scope="col">Title</th>
                        <th scope="col" class="text-end">Length</th>
                    </tr>
                </thead>
                <tbody>
                    ${tracklistHTML}
                </tbody>
            </table>
        `;
        
        modalPlayButton.href = album.tracklist[0].url;
    }

    function sortAlbums(albums) {
        if (currentSortMode === 'default') {
            return albums.sort((a, b) => a.id - b.id);
        }

        const albumsToSort = [...albums];

        switch (currentSortMode) {
            case 'artist-az':
                albumsToSort.sort((a, b) => a.artist.localeCompare(b.artist));
                break;
            case 'album-az':
                albumsToSort.sort((a, b) => a.album.localeCompare(b.album));
                break;
            case 'tracks-asc':
                albumsToSort.sort((a, b) => a.tracklist.length - b.tracklist.length);
                break;
            case 'tracks-desc':
                albumsToSort.sort((a, b) => b.tracklist.length - a.tracklist.length);
                break;
        }
        return albumsToSort;
    }

    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();

        const filteredAlbums = libraryData.filter(album => {
            const artistMatch = album.artist.toLowerCase().includes(searchTerm);
            const albumMatch = album.album.toLowerCase().includes(searchTerm);
            return artistMatch || albumMatch;
        });

        const sortedAlbums = sortAlbums(filteredAlbums);
        displayAlbums(sortedAlbums);
    }

    function handleScroll() {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    }

    function scrollToTop(event) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    albumGrid.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('.btn-tracklist');
        
        if (clickedButton) {
            const clickedAlbumId = clickedButton.dataset.albumId;
            const album = libraryData.find(a => a.id == clickedAlbumId);

            if (album) {
                populateModal(album);
                albumModal.show();
            } else {
                console.error('Album not found for ID:', clickedAlbumId);
            }
        }
    });

    searchInput.addEventListener('input', handleSearch);

    sortOptionsContainer.addEventListener('click', (event) => {
        const clickedSortOption = event.target.closest('.sort-option');
        if (clickedSortOption) {
            event.preventDefault();
            currentSortMode = clickedSortOption.dataset.sort;
            sortDropdownButton.textContent = `Sort by: ${clickedSortOption.textContent}`;
            handleSearch();
        }
    });

    window.addEventListener('scroll', handleScroll);
    backToTopButton.addEventListener('click', scrollToTop);

    loadLibrary();
});