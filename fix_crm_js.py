import re

with open('crm.js', 'r') as f:
    content = f.read()

# Replace the GSAP animation block
old_gsap = """    if (window.gsap) {
        gsap.fromTo('.history-card',
            { opacity: 0, y: 30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.2)', clearProps: 'all' }
        );
    } else {"""

new_gsap = """    if (window.gsap) {
        gsap.fromTo('.history-card',
            { opacity: 0, y: 30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.2)', clearProps: 'transform' }
        );
    } else {"""

content = content.replace(old_gsap, new_gsap)

with open('crm.js', 'w') as f:
    f.write(content)
