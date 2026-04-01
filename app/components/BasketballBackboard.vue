<template>
  <!-- This component doesn't render anything visible, it's just for creating 3D objects -->
 </template>
 <script setup>
 import * as THREE from 'three'
 const props = defineProps({
 centerX: {
 type: Number,
 required: true
  },
 centerY: {
 type: Number,
 required: true
  },
 centerZ: {
 type: Number,
 required: true
  },
 logoUrl: {
 type: String,
 default: 'logo-white-with-name.png'
  },
 topLogoTransparent: {
 type: Boolean,
 default: true
  },
 suzukiLogo: {
 type: Boolean,
 default: false
  }
 })
 // Create the backboard with sticker - all styling handled internally
 const createBackboard = () => {
 // Configuration constants
 const BACKBOARD_WIDTH = 6
 const BACKBOARD_HEIGHT = 3.5
 const BACKBOARD_DEPTH = 0.3
 const BACKBOARD_OPACITY = 0.1
 
 const PADDING_THICKNESS = 0.2
 const PADDING_DEPTH = 0.25
 const PADDING_OFFSET = 0.1
 const PADDING_COLOR = 0xf3f4f6
 
 const TARGET_SQUARE_WIDTH = 2
 const TARGET_SQUARE_HEIGHT = 1.5
 const TARGET_Y_OFFSET = -0.8
 const TARGET_BORDER_THICKNESS = 0.13
 
 const RIM_RADIUS = 0.65
 const RIM_TUBE_RADIUS = 0.06
 const RIM_COLOR = 0xff1100
 const RIM_Y_OFFSET = -1.2
 const RIM_Z_OFFSET = -0.6
 
 // Net configuration
 const NET_SEGMENTS = 16 // Number of rope segments around the rim (more for wider look)
 const NET_LENGTH = 0.9  // How long the net hangs down
 const NET_SWAY = 0.05   // Much less curve - more straight down
 const NET_COLOR = 0xf3f4f6
 
 const TOP_LOGO_WIDTH = 4.5
 const TOP_LOGO_Y_OFFSET = -0.7

 const TOP_LOGO_BG_WIDTH = 5.4
 const TOP_LOGO_BG_HEIGHT = 1.0
 const TOP_LOGO_BG_Y_OFFSET = -0.7

 const SUZUKI_WIDTH = 4.5
 const SUZUKI_Y_OFFSET = -0.7

 const SUZUKI_BG_WIDTH = 5.4
 const SUZUKI_BG_HEIGHT = 1.0
 const SUZUKI_BG_Y_OFFSET = -0.7
 
 const OBL_BASE_SIZE = 0.25
 const OBL_PADDING = 0.7
 const OBL_Y_PADDING = 0.2
 
 const Z_OFFSET_STICKERS = -0.16
 
 const backboardGroup = new THREE.Group()
 backboardGroup.name = 'backboard-group'
 const textureLoader = new THREE.TextureLoader()
 
 // Create main backboard geometry - use basic material for consistency
 const backboardGeometry = new THREE.BoxGeometry(BACKBOARD_WIDTH, BACKBOARD_HEIGHT, BACKBOARD_DEPTH)
 const backboardMaterial = new THREE.MeshBasicMaterial({
 color: 0xf3f4f6,
 transparent: true,
 opacity: BACKBOARD_OPACITY
  })
 const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial)
 backboard.position.set(props.centerX, props.centerY, props.centerZ)
 backboardGroup.add(backboard)
 
 // Create white padding around all borders (smaller)
 const paddingMaterial = new THREE.MeshBasicMaterial({
 color: PADDING_COLOR,
  })
 
 // Bottom padding
 const bottomPaddingGeometry = new THREE.BoxGeometry(BACKBOARD_WIDTH + 0.2, PADDING_THICKNESS, PADDING_DEPTH)
 const bottomPadding = new THREE.Mesh(bottomPaddingGeometry, paddingMaterial)
 bottomPadding.position.set(props.centerX, props.centerY - (BACKBOARD_HEIGHT/2) - PADDING_OFFSET, props.centerZ)
 backboardGroup.add(bottomPadding)
 
 // Top padding
 const topPadding = new THREE.Mesh(bottomPaddingGeometry, paddingMaterial)
 topPadding.position.set(props.centerX, props.centerY + (BACKBOARD_HEIGHT/2) + PADDING_OFFSET, props.centerZ)
 backboardGroup.add(topPadding)
 
 // Left side padding (extended by padding thickness on each end)
 const extendedHeight = BACKBOARD_HEIGHT + (2 * PADDING_THICKNESS)
 const sidePaddingGeometry = new THREE.BoxGeometry(PADDING_THICKNESS, extendedHeight, PADDING_DEPTH)
 const leftPadding = new THREE.Mesh(sidePaddingGeometry, paddingMaterial)
 leftPadding.position.set(props.centerX - (BACKBOARD_WIDTH/2) - PADDING_OFFSET, props.centerY, props.centerZ)
 backboardGroup.add(leftPadding)
 
 // Right side padding (extended by padding thickness on each end)
 const rightPadding = new THREE.Mesh(sidePaddingGeometry, paddingMaterial)
 rightPadding.position.set(props.centerX + (BACKBOARD_WIDTH/2) + PADDING_OFFSET, props.centerY, props.centerZ)
 backboardGroup.add(rightPadding)
 
 // Create gray border around whole backboard (inside white padding)
 const GRAY_BORDER_THICKNESS = 0.08
 const GRAY_BORDER_INSET = 0.15
 const grayBorderMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
 
 // Calculate gray border dimensions (slightly smaller than backboard)
 const grayBorderWidth = BACKBOARD_WIDTH - (2 * GRAY_BORDER_INSET)
 const grayBorderHeight = BACKBOARD_HEIGHT - (2 * GRAY_BORDER_INSET)
 
 // Gray border - Top
 const grayTopBorderGeometry = new THREE.PlaneGeometry(grayBorderWidth, GRAY_BORDER_THICKNESS);
 const grayTopBorder = new THREE.Mesh(grayTopBorderGeometry, grayBorderMaterial);
 grayTopBorder.rotation.y = Math.PI;
 grayTopBorder.position.set(props.centerX, props.centerY + (grayBorderHeight/2) - (GRAY_BORDER_THICKNESS/2), props.centerZ + Z_OFFSET_STICKERS + 0.005);
 backboardGroup.add(grayTopBorder);
 
 // Gray border - Bottom
 const grayBottomBorder = new THREE.Mesh(grayTopBorderGeometry, grayBorderMaterial);
 grayBottomBorder.rotation.y = Math.PI;
 grayBottomBorder.position.set(props.centerX, props.centerY - (grayBorderHeight/2) + (GRAY_BORDER_THICKNESS/2), props.centerZ + Z_OFFSET_STICKERS + 0.005);
 backboardGroup.add(grayBottomBorder);
 
 // Gray border - Left
 const graySideBorderGeometry = new THREE.PlaneGeometry(GRAY_BORDER_THICKNESS, grayBorderHeight);
 const grayLeftBorder = new THREE.Mesh(graySideBorderGeometry, grayBorderMaterial);
 grayLeftBorder.rotation.y = Math.PI;
 grayLeftBorder.position.set(props.centerX - (grayBorderWidth/2) + (GRAY_BORDER_THICKNESS/2), props.centerY, props.centerZ + Z_OFFSET_STICKERS + 0.005);
 backboardGroup.add(grayLeftBorder);
 
 // Gray border - Right
 const grayRightBorder = new THREE.Mesh(graySideBorderGeometry, grayBorderMaterial);
 grayRightBorder.rotation.y = Math.PI;
 grayRightBorder.position.set(props.centerX + (grayBorderWidth/2) - (GRAY_BORDER_THICKNESS/2), props.centerY, props.centerZ + Z_OFFSET_STICKERS + 0.005);
 backboardGroup.add(grayRightBorder);
 
 // Create the target square border (white border with transparent interior)
 const borderMaterial = new THREE.MeshBasicMaterial({ color: 0xf3f4f6 });
 
 // Top border
 const topBorderGeometry = new THREE.PlaneGeometry(TARGET_SQUARE_WIDTH, TARGET_BORDER_THICKNESS);
 const topBorder = new THREE.Mesh(topBorderGeometry, borderMaterial);
 topBorder.rotation.y = Math.PI;
 topBorder.position.set(props.centerX, props.centerY + TARGET_Y_OFFSET + (TARGET_SQUARE_HEIGHT/2) - (TARGET_BORDER_THICKNESS/2), props.centerZ + Z_OFFSET_STICKERS + 0.01);
 backboardGroup.add(topBorder);
 
 // Bottom border
 const bottomBorder = new THREE.Mesh(topBorderGeometry, borderMaterial);
 bottomBorder.rotation.y = Math.PI;
 bottomBorder.position.set(props.centerX, props.centerY + TARGET_Y_OFFSET - (TARGET_SQUARE_HEIGHT/2) + (TARGET_BORDER_THICKNESS/2), props.centerZ + Z_OFFSET_STICKERS + 0.01);
 backboardGroup.add(bottomBorder);
 
 // Left border
 const sideBorderGeometry = new THREE.PlaneGeometry(TARGET_BORDER_THICKNESS, TARGET_SQUARE_HEIGHT);
 const leftBorder = new THREE.Mesh(sideBorderGeometry, borderMaterial);
 leftBorder.rotation.y = Math.PI;
 leftBorder.position.set(props.centerX - (TARGET_SQUARE_WIDTH/2) + (TARGET_BORDER_THICKNESS/2), props.centerY + TARGET_Y_OFFSET, props.centerZ + Z_OFFSET_STICKERS + 0.01);
 backboardGroup.add(leftBorder);
 
 // Right border  
 const rightBorder = new THREE.Mesh(sideBorderGeometry, borderMaterial);
 rightBorder.rotation.y = Math.PI;
 rightBorder.position.set(props.centerX + (TARGET_SQUARE_WIDTH/2) - (TARGET_BORDER_THICKNESS/2), props.centerY + TARGET_Y_OFFSET, props.centerZ + Z_OFFSET_STICKERS + 0.01);
 backboardGroup.add(rightBorder);
 
 // Create basketball rim (positioned further from backboard)
 const rimGroup = new THREE.Group()
 
 // Main rim (orange/red color) - positioned further out
 const rimGeometry = new THREE.TorusGeometry(RIM_RADIUS, RIM_TUBE_RADIUS, 8, 16)
 const rimMaterial = new THREE.MeshBasicMaterial({
 color: RIM_COLOR,
  })
 const rim = new THREE.Mesh(rimGeometry, rimMaterial)
 rim.rotation.x = Math.PI / 2 // Rotate to be horizontal
 rim.position.set(props.centerX, props.centerY + RIM_Y_OFFSET, props.centerZ + RIM_Z_OFFSET)
 rimGroup.add(rim)
 
 // Create basketball net
 const createNet = () => {
   const netGroup = new THREE.Group()
   const netMaterial = new THREE.LineBasicMaterial({ 
     color: NET_COLOR,
     linewidth: 3
   })
   
   // Create vertical rope segments
   for (let i = 0; i < NET_SEGMENTS; i++) {
     const angle = (i / NET_SEGMENTS) * Math.PI * 2
     const points = []
     
     // Create points for each rope strand - gets narrower as it goes down
     for (let j = 0; j <= 10; j++) {
       const t = j / 10 // Parameter from 0 to 1 along the rope
       const baseRadius = RIM_RADIUS * 0.95 // Start slightly inside rim
       
       // Gradually reduce radius as we go down - creates tapered effect
       const taperFactor = 1 - (t * 0.3) // Reduces to 70% of original radius at bottom
       const currentRadius = baseRadius * taperFactor + (NET_SWAY * Math.sin(t * Math.PI * 0.8))
       
       const x = Math.cos(angle) * currentRadius
       const z = Math.sin(angle) * currentRadius
       const y = -t * NET_LENGTH // Hang downward
       
       points.push(new THREE.Vector3(x, y, z))
     }
     
     const ropeGeometry = new THREE.BufferGeometry().setFromPoints(points)
     const rope = new THREE.Line(ropeGeometry, netMaterial)
     rope.position.set(props.centerX, props.centerY + RIM_Y_OFFSET, props.centerZ + RIM_Z_OFFSET)
     netGroup.add(rope)
   }
   
   // Create horizontal connecting strands at different levels
   for (let level = 1; level <= 4; level++) {
     const t = level / 5 // At 1/5, 2/5, 3/5, and 4/5 down the net
     const baseRadius = RIM_RADIUS * 0.95
     const taperFactor = 1 - (t * 0.3) // Same tapering as vertical strands
     const currentRadius = baseRadius * taperFactor + (NET_SWAY * Math.sin(t * Math.PI * 0.8))
     const y = -t * NET_LENGTH
     
     const points = []
     for (let i = 0; i <= NET_SEGMENTS; i++) {
       const angle = (i / NET_SEGMENTS) * Math.PI * 2
       const x = Math.cos(angle) * currentRadius
       const z = Math.sin(angle) * currentRadius
       points.push(new THREE.Vector3(x, y, z))
     }
     
     const horizontalGeometry = new THREE.BufferGeometry().setFromPoints(points)
     const horizontalStrand = new THREE.Line(horizontalGeometry, netMaterial)
     horizontalStrand.position.set(props.centerX, props.centerY + RIM_Y_OFFSET, props.centerZ + RIM_Z_OFFSET)
     netGroup.add(horizontalStrand)
   }
   
   // Create bottom connections - diagonal connections between adjacent rope ends
   const bottomY = -NET_LENGTH
   const bottomRadius = RIM_RADIUS * 0.95 * 0.7 // Same as final taper factor
   
   for (let i = 0; i < NET_SEGMENTS; i++) {
     const angle1 = (i / NET_SEGMENTS) * Math.PI * 2
     const angle2 = ((i + 1) / NET_SEGMENTS) * Math.PI * 2
     
     const x1 = Math.cos(angle1) * bottomRadius
     const z1 = Math.sin(angle1) * bottomRadius
     const x2 = Math.cos(angle2) * bottomRadius
     const z2 = Math.sin(angle2) * bottomRadius
     
     const points = [
       new THREE.Vector3(x1, bottomY, z1),
       new THREE.Vector3(x2, bottomY, z2)
     ]
     
     const connectionGeometry = new THREE.BufferGeometry().setFromPoints(points)
     const connection = new THREE.Line(connectionGeometry, netMaterial)
     connection.position.set(props.centerX, props.centerY + RIM_Y_OFFSET, props.centerZ + RIM_Z_OFFSET)
     netGroup.add(connection)
   }
   
   return netGroup
 }
 
 const basketballNet = createNet()
 rimGroup.add(basketballNet)
 
 backboardGroup.add(rimGroup)
 
 // Position for the top of the backboard
 if (props.suzukiLogo) {
   // Suzuki logo with white background
   const topOfBackboard = props.centerY + (BACKBOARD_HEIGHT / 2) + SUZUKI_Y_OFFSET
   const topOfBackboardBG = props.centerY + (BACKBOARD_HEIGHT / 2) + SUZUKI_BG_Y_OFFSET

   // Create white background for Suzuki sticker (always visible)
   const suzukiBackgroundGeometry = new THREE.PlaneGeometry(SUZUKI_BG_WIDTH, SUZUKI_BG_HEIGHT);
   const suzukiBackgroundMaterial = new THREE.MeshBasicMaterial({
     color: 0xf3f4f6,
     transparent: false,
     opacity: 1.0
   });
   const suzukiBackgroundMesh = new THREE.Mesh(suzukiBackgroundGeometry, suzukiBackgroundMaterial);
   suzukiBackgroundMesh.rotation.y = Math.PI;
   suzukiBackgroundMesh.position.set(
     props.centerX,
     topOfBackboardBG,
     props.centerZ + Z_OFFSET_STICKERS + 0.01
   );
   backboardGroup.add(suzukiBackgroundMesh);

   // Create suzuki sticker with automatic height calculation
   const suzukiStickerGeometry = new THREE.PlaneGeometry(1.0, 1.0) // Start with square
   const suzukiTexture = textureLoader.load(
   '/suzuki.png',
   function(texture) {
   // Calculate height based on aspect ratio
   const suzukiAspect = texture.image.width / texture.image.height;
   const calculatedHeight = SUZUKI_WIDTH / suzukiAspect;

   // Scale the suzuki sticker to match
   suzukiStickerMesh.scale.set(SUZUKI_WIDTH, calculatedHeight, 1);
    }
    )
   suzukiTexture.wrapS = THREE.ClampToEdgeWrap
   suzukiTexture.wrapT = THREE.ClampToEdgeWrap
   suzukiTexture.minFilter = THREE.LinearMipmapLinearFilter
   suzukiTexture.magFilter = THREE.LinearFilter
   suzukiTexture.anisotropy = 16 // Maximum anisotropic filtering for better quality
   suzukiTexture.colorSpace = THREE.SRGBColorSpace
   suzukiTexture.generateMipmaps = true
   suzukiTexture.needsUpdate = true

   const suzukiStickerMaterial = new THREE.MeshBasicMaterial({
   map: suzukiTexture,
   transparent: true,
   alphaTest: 0.01,
   side: THREE.FrontSide,
   color: 0xf3f4f6,
   depthWrite: true
    })
   const suzukiStickerMesh = new THREE.Mesh(suzukiStickerGeometry, suzukiStickerMaterial)
   suzukiStickerMesh.rotation.y = Math.PI
   suzukiStickerMesh.position.set(
   props.centerX,
   topOfBackboard,
   props.centerZ + Z_OFFSET_STICKERS
    )
   backboardGroup.add(suzukiStickerMesh)
 } else {
   // Standard logo-with-name
   const topOfBackboard = props.centerY + (BACKBOARD_HEIGHT / 2) + TOP_LOGO_Y_OFFSET
   const topOfBackboardBG = props.centerY + (BACKBOARD_HEIGHT / 2) + TOP_LOGO_BG_Y_OFFSET

   // Create white background for top logo sticker (only if not transparent mode)
   if (!props.topLogoTransparent) {
     const topLogoBackgroundGeometry = new THREE.PlaneGeometry(TOP_LOGO_BG_WIDTH, TOP_LOGO_BG_HEIGHT);
     const topLogoBackgroundMaterial = new THREE.MeshBasicMaterial({
       color: 0xf3f4f6,
       transparent: false,
       opacity: 1.0
     });
     const topLogoBackgroundMesh = new THREE.Mesh(topLogoBackgroundGeometry, topLogoBackgroundMaterial);
     topLogoBackgroundMesh.rotation.y = Math.PI;
     topLogoBackgroundMesh.position.set(
       props.centerX,
       topOfBackboardBG,
       props.centerZ + Z_OFFSET_STICKERS + 0.01
     );
     backboardGroup.add(topLogoBackgroundMesh);
   }

   // Create top logo sticker with automatic height calculation
   const topLogoStickerGeometry = new THREE.PlaneGeometry(1.0, 1.0) // Start with square
   const topLogoTexture = textureLoader.load(
   '/logo-with-name.png',
   function(texture) {
   // Calculate height based on aspect ratio
   const topLogoAspect = texture.image.width / texture.image.height;
   const calculatedHeight = TOP_LOGO_WIDTH / topLogoAspect;

   // Scale the top logo sticker to match
   topLogoStickerMesh.scale.set(TOP_LOGO_WIDTH, calculatedHeight, 1);
    }
    )
   topLogoTexture.wrapS = THREE.ClampToEdgeWrap
   topLogoTexture.wrapT = THREE.ClampToEdgeWrap
   topLogoTexture.minFilter = THREE.LinearMipmapLinearFilter
   topLogoTexture.magFilter = THREE.LinearFilter
   topLogoTexture.anisotropy = 16 // Maximum anisotropic filtering for better quality
   topLogoTexture.colorSpace = THREE.SRGBColorSpace
   topLogoTexture.generateMipmaps = true
   topLogoTexture.needsUpdate = true

   const topLogoStickerMaterial = new THREE.MeshBasicMaterial({
   map: topLogoTexture,
   transparent: true,
   alphaTest: 0.01,
   side: THREE.FrontSide,
   color: 0xf3f4f6,
   depthWrite: true
    })
   const topLogoStickerMesh = new THREE.Mesh(topLogoStickerGeometry, topLogoStickerMaterial)
   topLogoStickerMesh.rotation.y = Math.PI
   topLogoStickerMesh.position.set(
   props.centerX,
   topOfBackboard,
   props.centerZ + Z_OFFSET_STICKERS
    )
   backboardGroup.add(topLogoStickerMesh)
 }
 
 // Create OBL sticker in bottom right corner with preserved aspect ratio
 const oblStickerGeometry = new THREE.PlaneGeometry(1.0, 1.0) // Start with square
 const oblStickerMaterial = new THREE.MeshBasicMaterial({
 transparent: true,
 alphaTest: 0.01,
 side: THREE.FrontSide,
 color: 0xf3f4f6,
 depthWrite: true
  })
 const oblStickerMesh = new THREE.Mesh(oblStickerGeometry, oblStickerMaterial)
 oblStickerMesh.rotation.y = Math.PI
 
 const oblTexture = textureLoader.load(
 `/${props.logoUrl}`,
 function(texture) {
 const realAspect = texture.image.width / texture.image.height;
 
 // Apply the texture to the material
 oblStickerMaterial.map = texture;
 oblStickerMaterial.needsUpdate = true;
 
 // Preserve aspect ratio by scaling based on actual image dimensions
 if (realAspect > 1) {
   // Image is wider than tall
   oblStickerMesh.scale.set(OBL_BASE_SIZE * realAspect, OBL_BASE_SIZE, 1);
 } else {
   // Image is taller than wide
   oblStickerMesh.scale.set(OBL_BASE_SIZE, OBL_BASE_SIZE / realAspect, 1);
 }
  }
  )
 oblTexture.wrapS = THREE.ClampToEdgeWrap
 oblTexture.wrapT = THREE.ClampToEdgeWrap
 oblTexture.minFilter = THREE.LinearMipmapLinearFilter
 oblTexture.magFilter = THREE.LinearFilter
 oblTexture.anisotropy = 16 // Maximum anisotropic filtering for better quality
 oblTexture.colorSpace = THREE.SRGBColorSpace
 oblTexture.generateMipmaps = true
 oblTexture.needsUpdate = true
 
 // Position in bottom RIGHT corner of backboard - corrected for rotation
 // Since rotation.y = Math.PI flips the coordinate system, we need to use negative offset for right side
 const rightPosition = props.centerX - (BACKBOARD_WIDTH/2) + OBL_PADDING + (OBL_BASE_SIZE / 2)
 const bottomPosition = props.centerY - (BACKBOARD_HEIGHT / 2) + OBL_Y_PADDING + (OBL_BASE_SIZE / 2)
 
 oblStickerMesh.position.set(
 rightPosition,
 bottomPosition,
 props.centerZ + Z_OFFSET_STICKERS
  )
 backboardGroup.add(oblStickerMesh)
 
 return backboardGroup
 }
 // Expose the create function for parent components
 defineExpose({
 createBackboard
 })
 </script>