document.addEventListener('DOMContentLoaded', () => {
    fetch('images.json')
        .then(response => response.json())
        .then(data => {
            loadImages(data);
            initializeMap(data);
        });

    const gallery = document.getElementById('gallery');
    const filterInfo = document.getElementById('filter-info');
    const filterText = document.getElementById('filter-text');
    const resetFilterBtn = document.getElementById('reset-filter');
    const locationText = document.getElementById('location-text');
    const randomImagesContainer = document.getElementById('random-images');
    const imageModal = document.getElementById('imageModal');
    const selectedImage = document.getElementById('selectedImage');
    const mappedImage = document.getElementById('mappedImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const closeModal = document.getElementById('closeModal');
    let activeMarker = null;
    let imagesData = [];
    let markers = [];
    let map;
    let currentTheme = 'all'; // Track the current theme filter
    let currentLocation = null; // Track the current location filter

    // Initialize Swiper
    const swiper = new Swiper('.swiper-container', {
        pagination: {
            el: '.swiper-pagination',
            type: 'bullets',
        },
        loop: false,
        slidesPerView: 1,
        spaceBetween: 10
    });

    resetFilterBtn.addEventListener('click', () => {
        resetActiveMarker();
        currentLocation = null;
        updateFilterText();
        applyFilters(); // Apply the current theme filter without location filter
        resetFilterBtn.classList.add('hidden'); // Hide the reset button
        locationText.classList.add('hidden'); // Hide the location text
    });

    document.getElementById('show-random-images').addEventListener('click', () => {
        showRandomImagesWithEffect(imagesData);
    });

    function loadImages(images) {
        imagesData = images;
        applyFilters(); // Apply current filters to the gallery
    }

    const modalImagesMapping = {
        "images/bin_3_lisbon.png": {
            src: "images/bin_3_lisbon_street.png",
            title: "乌龟头",
            description: "“不是乌龟头。可能是鸽子头？”"
        },
        "images/random_1_beijing.png": {
            src: "images/random_1.2_beijing.png",
            title: "下水道上的猫",
            description: "“这是一只栖息在北京玉渊潭公园井盖上的赛博猫娘。当科研人员发现她时，她正在利用下水道风冷降低机箱温度。”"
        },
        "images/item_1_shenzhen.png": {
            src: "images/item_1.2_shenzhen.png",
            title: "井盖？",
            description: "“两张图拍摄相隔四年，设备也不一样。”"
        },
        "images/manhole_7_beijing.png": {
            src: "images/manhole_7.2_beijing.png",
            title: "樱花园里的井盖",
            description: "“已知：樱花园里有樱花妹。求解：什么井里有black water？”"
        },
        "images/Q.png": {
            src: "images/Q.2.png",
            title: "感谢试用❤",
            description: "AI来自天井一号\(￣︶￣*\))！"
        }
        
    };

    function openModal(src) {
        const selectedImageSrc = src;
        const modalData = modalImagesMapping[src] || { src: src, title: "Default Title", description: "Default description." };
        
        // Show the selected image and mapped modal image in the Swiper carousel
        selectedImage.src = selectedImageSrc;
        mappedImage.src = modalData.src;
        modalTitle.innerText = modalData.title;
        modalDescription.innerText = modalData.description;
        imageModal.classList.remove('hidden');

        // Reset Swiper to the first slide
        swiper.slideTo(0, 0);
        
        // Update Swiper to reflect the changes
        swiper.update();
    }

    function closeModalFunction() {
        imageModal.classList.add('hidden');
    }

    imageModal.addEventListener('click', (event) => {
        if (event.target === imageModal || event.target === closeModal) {
            closeModalFunction();
        }
    });




    document.getElementById('themeFilter').addEventListener('change', (event) => {
        currentTheme = event.target.value;
        filterMarkersByTheme(currentTheme);
        applyFilters(); // Apply the theme filter to the gallery
        if (currentLocation) {
            locationText.classList.remove('hidden'); // Ensure location text remains visible
            resetFilterBtn.classList.remove('hidden'); // Ensure reset button remains visible
        }
    });

    function initializeMap(images) {
        map = L.map('map').setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 9,
        }).addTo(map);

        const customIcon = L.icon({
            iconUrl: 'images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [0, -41]
        });

        images.forEach(image => {
            if (image.lat && image.lon) {
                const marker = L.marker([image.lat, image.lon], { icon: customIcon }).addTo(map);
                marker.image = image;

                marker.on('click', () => {
                    currentLocation = image.location;
                    filterImagesByLocation(image.location);
                    changeMarkerColor(marker);
                    resetFilterBtn.classList.remove('hidden'); // Show the reset button when a map marker is clicked
                    locationText.classList.remove('hidden'); // Show the location text when a map marker is clicked
                });

                marker.bindPopup(`<b>${image.location}</b>`);
                marker.on('mouseover', () => marker.openPopup());
                marker.on('mouseout', () => marker.closePopup());

                markers.push(marker);
            }
        });
    }

    function filterMarkersByTheme(theme) {
        markers.forEach(marker => {
            if (theme === 'all' || marker.image.theme === theme) {
                marker.addTo(map);
            } else {
                map.removeLayer(marker);
            }
        });

        updateFilterText();
    }

    function filterImagesByLocation(location) {
        const filteredImages = imagesData.filter(image => (currentTheme === 'all' || image.theme === currentTheme) && image.location === location);
        displayImages(filteredImages);
        updateFilterText();
    }

    function applyFilters() {
        const filteredImages = imagesData.filter(image => (currentTheme === 'all' || image.theme === currentTheme) && (!currentLocation || image.location === currentLocation));
        displayImages(filteredImages);
        updateFilterText();
    }

    function displayImages(images) {
        gallery.innerHTML = '';

        images.filter(image => image.src !== "images/Q.png").forEach(image => { // Exclude "Q" image from gallery

            
            const imgContainer = document.createElement('div');
            imgContainer.className = 'relative w-1/4 sm:w-1/5 md:w-1/6 lg:w-1/8 xl:w-1/10 p-1 m-6';

            const imgElement = document.createElement('img');
            imgElement.src = image.src;
            imgElement.alt = `${image.location} - ${image.theme}`;
            imgElement.className = 'w-full h-full rounded-lg transition transform hover:scale-105 cursor-pointer';
            imgElement.dataset.location = image.location;
            imgElement.dataset.theme = image.theme;
            imgElement.dataset.color = image.color;

            const tag = document.createElement('span');
            tag.className = 'absolute left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-3 py-1 rounded opacity-0 text-center';
            tag.innerHTML = `${image.theme}<br><span class="text-gray-400">${image.location}</span>`;

            imgContainer.appendChild(imgElement);
            imgContainer.appendChild(tag);
            gallery.appendChild(imgContainer);

            imgElement.addEventListener('click', () => openModal(image.src));

            imgContainer.addEventListener('mouseenter', () => {
                tag.classList.remove('opacity-0');
                tag.classList.add('opacity-100');
            });

            imgContainer.addEventListener('mouseleave', () => {
                tag.classList.remove('opacity-100');
                tag.classList.add('opacity-0');
            });
        });
    }

    function updateFilterText() {
        let filterTextContent = '';
        if (currentTheme !== 'all') {
            filterTextContent += `${currentTheme} 数据集`;
        }
        if (currentLocation) {
            locationText.innerHTML = ` ${currentLocation}`;
            locationText.classList.remove('hidden'); // Ensure location text is visible
        }
        filterText.innerHTML = filterTextContent;
        filterInfo.classList.toggle('hidden', !filterTextContent);
        resetFilterBtn.classList.toggle('hidden', !currentLocation); // Ensure reset button is visible when a location filter is active
    }

    function changeMarkerColor(marker) {
        if (activeMarker) {
            activeMarker.setIcon(L.icon({ iconUrl: 'images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }));
        }
        marker.setIcon(L.icon({ iconUrl: 'images/marker-icon-dark.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }));
        activeMarker = marker;
    }

    function resetActiveMarker() {
        if (activeMarker) {
            activeMarker.setIcon(L.icon({ iconUrl: 'images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }));
            activeMarker = null;
        }
    }

    function showRandomImagesWithEffect(images) {
        randomImagesContainer.innerHTML = '';
        let drawCount = 0;
        const drawInterval = setInterval(() => {
            randomImagesContainer.innerHTML = '';
            const randomImages = [];
            while (randomImages.length < 3) {
                const randomImage = images[Math.floor(Math.random() * images.length)];
                if (!randomImages.includes(randomImage)) {
                    randomImages.push(randomImage);
                }
            }
            randomImages.forEach(image => {
                const imgElement = document.createElement('img');
                imgElement.src = image.src;
                imgElement.alt = `${image.location} - ${image.theme}`;
                imgElement.className = 'object-cover w-1/3 h-full p-1 rounded-lg transition transform hover:scale-105 cursor-pointer';
                imgElement.addEventListener('click', () => openModal(image.src)); // Make the random images clickable
                randomImagesContainer.appendChild(imgElement);
            });
            drawCount += 1;
            if (drawCount === 10) {
                clearInterval(drawInterval);
            }
        }, 100);
    }
});