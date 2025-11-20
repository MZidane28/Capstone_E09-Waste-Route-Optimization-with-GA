"use client" 

export default function SummaryCard({
    value, 
    label, 
    addInfo,
    icon,
    iconBgColor = 'bg-gray-100',
    iconColor = 'text-gray-600',
}){
    return (
        <div className="p-4 bg-white rounded-[18px] border-2 border-black">
            {icon && (
                <div className="flex items-center gap-8 mb-3">
                    <div className={`p-3 rounded-lg ${iconBgColor}`}>
                        <div className={`${iconColor}`}>
                        {icon}
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-black">
                            {value}
                        </div>
                        <div className="text-md text-gray-600 mt-1">
                            {label}
                        </div>
                    </div>
                </div>
            )}

            {addInfo && (
                <div className="text-xs text-gray-500 mt-1">
                {addInfo}
                </div>
            )}
        </div>
    )
}