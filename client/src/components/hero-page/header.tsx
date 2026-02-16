'use client'
import Link from 'next/link'
import { Menu, X, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { useScroll, motion } from 'motion/react'
import { cn } from '@/lib/utils'

const menuItems: { name: string; href: string }[] = []

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)
    const { scrollYProgress } = useScroll()

    React.useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            setScrolled(latest > 0.05)
        })
        return () => unsubscribe()
    }, [scrollYProgress])

    // Close menu when clicking outside on mobile
    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024 && menuState) {
                setMenuState(false)
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [menuState])

    return (
        <header className="w-full">
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full pt-2 left-0 right-0">
                <div className={cn(
                    'mx-auto max-w-7xl rounded-3xl px-4 sm:px-6 lg:px-12 transition-all duration-300',
                    scrolled && 'bg-background/50 backdrop-blur-2xl'
                )}>
                    <motion.div
                        key={1}
                        className={cn(
                            'relative flex flex-wrap items-center justify-between gap-6 py-3 duration-200 lg:gap-0 lg:py-6',
                            scrolled && 'lg:py-4'
                        )}>
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2 touch-manipulation active:scale-95 transition-transform">
                                <div className="flex items-center justify-center w-12 h-12 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground shadow-md">
                                    <IndianRupee className="w-7 h-7 sm:w-6 sm:h-6 font-bold stroke-[2.5]" />
                                </div>
                                <span className="text-lg sm:text-xl font-bold">FinOS</span>
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden touch-manipulation active:scale-95 transition-transform">
                                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>

                            <div className="hidden lg:block">
                                <ul className="flex gap-8 text-sm">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="relative text-muted-foreground hover:text-foreground font-medium transition-all duration-300 group">
                                                <span className="relative z-10">{item.name}</span>
                                                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className={cn(
                            'hidden w-full items-center justify-end',
                            'lg:m-0 lg:flex lg:w-fit lg:gap-6',
                            'in-data-[state=active]:block lg:in-data-[state=active]:flex'
                        )}>
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                onClick={() => setMenuState(false)}
                                                className="relative text-muted-foreground hover:text-foreground font-medium transition-all duration-300 group flex items-center touch-manipulation">
                                                <span className="relative z-10">{item.name}</span>
                                                <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Link 
                                    href="/login" 
                                    className="text-lg font-bold hover:text-primary transition-colors duration-300">
                                    Login
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </nav>
        </header>
    )
}