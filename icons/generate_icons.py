#!/usr/bin/env python3
"""
Simple icon generator for the Cute Wallpapers extension
Creates basic gradient icons for development/testing purposes
"""

try:
    from PIL import Image, ImageDraw
    import os
    
    def create_gradient_icon(size, filename):
        """Create a simple gradient icon"""
        # Create image with RGBA mode for transparency
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Create a simple gradient effect
        for y in range(size):
            # Calculate color based on position
            ratio = y / size
            r = int(102 + (118 - 102) * ratio)  # 102 to 118 (hex 66 to 76)
            g = int(126 + (75 - 126) * ratio)   # 126 to 75  (hex 7e to 4b)  
            b = int(234 + (162 - 234) * ratio)  # 234 to 162 (hex ea to a2)
            
            # Draw line with calculated color
            draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
        
        # Add a simple flower emoji-like shape (circle with petals)
        if size >= 32:
            center = size // 2
            petal_size = size // 8
            
            # Draw flower petals (white circles)
            for angle in [0, 45, 90, 135, 180, 225, 270, 315]:
                import math
                x = center + int((size // 4) * math.cos(math.radians(angle)))
                y = center + int((size // 4) * math.sin(math.radians(angle)))
                draw.ellipse([x - petal_size, y - petal_size, x + petal_size, y + petal_size], 
                           fill=(255, 255, 255, 200))
            
            # Draw center (yellow)
            draw.ellipse([center - petal_size, center - petal_size, 
                         center + petal_size, center + petal_size], 
                        fill=(255, 255, 140, 255))
        
        # Save the image
        img.save(filename, 'PNG')
        print(f"Created {filename} ({size}x{size})")
    
    # Create icons
    icon_sizes = [16, 32, 48, 128]
    for size in icon_sizes:
        create_gradient_icon(size, f'icon{size}.png')
    
    print("All icons created successfully!")
    
except ImportError:
    print("PIL (Pillow) not available. Creating placeholder files instead...")
    
    # Create placeholder files
    for size in [16, 32, 48, 128]:
        filename = f'icon{size}.png'
        with open(filename, 'w') as f:
            f.write(f"# Placeholder for {size}x{size} icon\n")
            f.write("# Replace this with an actual PNG icon file\n")
        print(f"Created placeholder {filename}")
    
    print("\nTo create actual icons, install Pillow:")
    print("pip install Pillow")
    print("Then run this script again.")

except Exception as e:
    print(f"Error creating icons: {e}")
    print("Creating text placeholders instead...")
    
    # Create placeholder files
    for size in [16, 32, 48, 128]:
        filename = f'icon{size}.png'
        with open(filename, 'w') as f:
            f.write(f"Placeholder for {size}x{size} icon file")
        print(f"Created placeholder {filename}")