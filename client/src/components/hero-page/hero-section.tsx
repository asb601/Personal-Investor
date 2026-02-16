"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroHeader } from './header'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ChevronRight } from 'lucide-react'

export default function HeroSection() {
    return (
        <div className="w-full overflow-x-hidden">
            <HeroHeader />
            <main className="w-full h-screen flex flex-col">
                <section className="w-full flex-1 flex items-center">
                    <div className="w-full py-8 md:py-12 pt-24 md:pt-32 lg:pt-40">
                        <div className="relative mx-auto flex max-w-7xl flex-col px-6 sm:px-6 lg:block lg:px-12">
                            <div className="mx-auto max-w-lg text-center lg:ml-0 lg:max-w-full lg:text-left">
                                <h1 className="max-w-2xl text-balance text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight">
                                    Personal Financial Intelligence OS
                                </h1>
                                <p className="mt-6 max-w-2xl text-balance text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                                    Internal system for tracking income, optimizing spending, and making research-driven investment decisions.
                                </p>
                            </div>
                            
                            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-12 w-full max-w-xs sm:w-auto rounded-full pl-5 pr-3 text-base font-semibold touch-manipulation active:scale-95 transition-transform shadow-lg hover:shadow-xl">
                                    <Link href="/home">
                                        <span className="text-nowrap">Start Building</span>
                                        <ChevronRight className="ml-1" />
                                    </Link>
                                </Button>
                            </div>

                            {/* Running Words Animation - Moved here */}
                            <div className="mt-16 lg:mt-20">
                                <div className="flex flex-col items-center gap-6">
                                    {/* Half-width border line */}
                                    <div className="w-1/2 h-px bg-border/50"></div>
                                    
                                    <div className="w-full flex flex-col md:flex-row items-center gap-4 md:gap-6">
                                        <div className="md:min-w-[12rem] text-center md:text-start shrink-0">
                                            <p className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                                                Powering the best teams
                                            </p>
                                        </div>
                                      
                                        <div className="relative w-full flex-1 overflow-hidden py-3">
                                            <InfiniteSlider
                                                speedOnHover={15}
                                                speed={30}
                                                gap={100}
                                                className="will-change-transform">
                                                <div className="flex px-6">
                                                    <p className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">Track Income</p>
                                                </div>

                                                <div className="flex px-6">
                                                    <p className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">Optimize Spending</p>
                                                </div>
                                                
                                                <div className="flex px-6">
                                                    <p className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">Smart Investments</p>
                                                </div>
                                            </InfiniteSlider>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}