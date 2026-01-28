import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"

const ResponsiveModalContext = React.createContext<{ isMobile: boolean }>({ isMobile: false })

export const ResponsiveModal = ({ children, ...props }: React.ComponentProps<typeof Dialog>) => {
  const isMobile = useIsMobile()
  
  return (
    <ResponsiveModalContext.Provider value={{ isMobile }}>
      {isMobile ? <Drawer {...props}>{children}</Drawer> : <Dialog {...props}>{children}</Dialog>}
    </ResponsiveModalContext.Provider>
  )
}

export const ResponsiveModalContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ className, children, ...props }, ref) => {
  const { isMobile } = React.useContext(ResponsiveModalContext)
  
  if (isMobile) {
    return (
      <DrawerContent ref={ref as any} {...props}>
         <div className="max-h-[80vh] overflow-y-auto px-4 pb-4">
             {children}
         </div>
      </DrawerContent>
    )
  }
  return (
    <DialogContent ref={ref} className={className} {...props}>
      {children}
    </DialogContent>
  )
})
ResponsiveModalContent.displayName = "ResponsiveModalContent"

export const ResponsiveModalHeader = ({ className, ...props }: React.ComponentProps<typeof DialogHeader>) => {
  const { isMobile } = React.useContext(ResponsiveModalContext)
  if (isMobile) return <DrawerHeader className={className} {...props} />
  return <DialogHeader className={className} {...props} />
}

export const ResponsiveModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogTitle>,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => {
  const { isMobile } = React.useContext(ResponsiveModalContext)
  if (isMobile) return <DrawerTitle ref={ref as any} className={className} {...props} />
  return <DialogTitle ref={ref} className={className} {...props} />
})
ResponsiveModalTitle.displayName = "ResponsiveModalTitle"

export const ResponsiveModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogDescription>,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, ...props }, ref) => {
  const { isMobile } = React.useContext(ResponsiveModalContext)
  if (isMobile) return <DrawerDescription ref={ref as any} className={className} {...props} />
  return <DialogDescription ref={ref} className={className} {...props} />
})
ResponsiveModalDescription.displayName = "ResponsiveModalDescription"

export const ResponsiveModalFooter = ({ className, ...props }: React.ComponentProps<typeof DialogFooter>) => {
  const { isMobile } = React.useContext(ResponsiveModalContext)
  if (isMobile) return <DrawerFooter className={className} {...props} />
  return <DialogFooter className={className} {...props} />
}