import { NextRequest, NextResponse } from 'next/server';
import Candidate from '@/models/candidate';
import connectToDatabase from '@/lib/mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    // Validate if the ID is a valid ObjectId
    if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid candidate ID' },
        { status: 400 }
      );
    }
    
    const deletedCandidate = await Candidate.findByIdAndDelete(id);
    
    if (!deletedCandidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Candidate deleted successfully',
        deletedCandidate 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete candidate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete candidate' },
      { status: 500 }
    );
  }
}

// We'll also add a GET method to fetch a single candidate if needed
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    // Validate if the ID is a valid ObjectId
    if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid candidate ID' },
        { status: 400 }
      );
    }
    
    const candidate = await Candidate.findById(id);
    
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, candidate }, { status: 200 });
  } catch (error: any) {
    console.error('Get candidate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch candidate' },
      { status: 500 }
    );
  }
}